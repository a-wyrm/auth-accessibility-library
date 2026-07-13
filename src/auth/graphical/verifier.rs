use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Algorithm, Argon2, Params, Version,
};

use super::{
    canonicalization::{canonicalize_graphical_selection, enrollment_secret},
    graphical_animal_pool,
    GraphicalCredentialRecord, GraphicalEnrollmentData, GraphicalLoginInput,
    GraphicalPasswordError,
};

#[derive(Debug, Clone, Copy)]
pub struct GraphicalVerifierConfig {
    pub algorithm_version: u16,
    pub policy_version: u16,
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

impl Default for GraphicalVerifierConfig {
    fn default() -> Self {
        Self {
            algorithm_version: 1,
            policy_version: 1,
            memory_kib: 19 * 1024,
            iterations: 2,
            parallelism: 1,
        }
    }
}

pub struct GraphicalVerifier {
    config: GraphicalVerifierConfig,
}

impl GraphicalVerifier {
    pub fn new(config: GraphicalVerifierConfig) -> Self {
        Self { config }
    }

    pub fn derive_verifier(
        &self,
        data: &GraphicalEnrollmentData,
    ) -> Result<GraphicalCredentialRecord, GraphicalPasswordError> {
        let secret = enrollment_secret(data).ok_or(GraphicalPasswordError::InvalidImageData)?;
        let canonical = canonicalize_graphical_selection(secret.as_str(), data.animal_id.as_str());
        let argon2 = self.argon2_instance()?;
        let salt = SaltString::generate(&mut OsRng);

        let verifier_phc = argon2
            .hash_password(canonical.as_slice(), &salt)
            .map_err(|err| GraphicalPasswordError::EnrollmentFailed(err.to_string()))?
            .to_string();

        Ok(GraphicalCredentialRecord {
            algorithm_version: self.config.algorithm_version,
            policy_version: self.config.policy_version,
            loved_one_image_hash: secret,
            secret_animal_id: data.animal_id.trim().to_string(),
            verifier_phc,
            animal_array: generated_animal_array(&data.user_id, &data.animal_id),
        })
    }

    pub fn verify(
        &self,
        input: &GraphicalLoginInput,
        stored: &GraphicalCredentialRecord,
    ) -> Result<bool, GraphicalPasswordError> {
        let canonical = canonicalize_graphical_selection(
            input.selected_face.as_str(),
            input.selected_animal_id.as_str(),
        );
        let argon2 = self.argon2_instance()?;
        let parsed_hash = PasswordHash::new(stored.verifier_phc.as_str())
            .map_err(|err| GraphicalPasswordError::VerificationFailed(err.to_string()))?;

        match argon2.verify_password(canonical.as_slice(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(err) => Err(GraphicalPasswordError::VerificationFailed(err.to_string())),
        }
    }

    fn argon2_instance(&self) -> Result<Argon2<'static>, GraphicalPasswordError> {
        let params = Params::new(
            self.config.memory_kib,
            self.config.iterations,
            self.config.parallelism,
            None,
        )
        .map_err(|err| GraphicalPasswordError::EnrollmentFailed(err.to_string()))?;

        Ok(Argon2::new(Algorithm::Argon2id, Version::V0x13, params))
    }
}

fn generated_animal_array(user_id: &str, animal_id: &str) -> Vec<String> {
    let mut animals: Vec<String> = graphical_animal_pool()
        .into_iter()
        .map(|animal| animal.id)
        .collect();

    if animals.is_empty() {
        return animals;
    }

    let seed = user_id
        .trim()
        .bytes()
        .chain(animal_id.trim().bytes())
        .fold(0usize, |acc, byte| acc.wrapping_add(byte as usize));
    let rotation = seed % animals.len();
    animals.rotate_left(rotation);
    animals
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matching_graphical_selection_verifies() {
        let verifier = GraphicalVerifier::new(GraphicalVerifierConfig::default());
        let enrollment = GraphicalEnrollmentData {
            user_id: "test-user".to_string(),
            loved_one_img_hash: Some("face-1".to_string()),
            image_data: None,
            animal_id: "a1".to_string(),
            animal_array: vec!["a".to_string(), "b".into(), "c".into()],
        };
        let login = GraphicalLoginInput {
            user_id: "test-user".to_string(),
            selected_face: "face-1".to_string(),
            selected_animal_id: "a1".to_string(),
            animal_array: vec!["a".to_string(), "b".into(), "c".into()],
        };

        let record = verifier.derive_verifier(&enrollment).unwrap();
        assert!(verifier.verify(&login, &record).unwrap());
    }
}
