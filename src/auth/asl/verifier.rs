use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Algorithm, Argon2, Params, Version,
};

use crate::config::Config;

use super::{canonicalize_selection, AslCredentialRecord, EnrollmentSelection, LoginSelection};

#[derive(Debug, Error)]
pub enum VerifierError {
    // Argon2 parameter set is invalid for the current runtime/library constraints.
    #[error("invalid argon2 parameters: {0}")]
    InvalidParams(String),
    // Hash derivation failed while creating a new enrollment verifier.
    #[error("could not create verifier hash: {0}")]
    HashBuild(String),
    // Persisted verifier string is malformed and cannot be parsed as PHC.
    #[error("stored verifier has invalid PHC format: {0}")]
    InvalidStoredVerifier(String),
    // Non-password verification failures bubble up as internal errors.
    #[error("verification failed due to internal error: {0}")]
    VerificationInternal(String),
}

#[derive(Debug, Clone, Copy)]
pub struct AslVerifierConfig {
    // Version fields allow forward-compatible migration of verifier formats
    pub algorithm_version: u16,
    pub policy_version: u16,

    // Argon2 tuning values are loaded from app config
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

impl AslVerifierConfig {
    pub fn from_app_config(config: &Config) -> Self {
        Self {
            algorithm_version: config.asl_algorithm_version,
            policy_version: config.asl_policy_version,
            memory_kib: config.argon2_memory_kib,
            iterations: config.argon2_iterations,
            parallelism: config.argon2_parallelism,
        }
    }
}

pub struct AslVerifier {
    config: AslVerifierConfig,
}

impl AslVerifier {
    pub fn new(config: AslVerifierConfig) -> Self {
        Self { config }
    }

    pub fn derive_verifier(
        &self,
        selection: &EnrollmentSelection,
    ) -> Result<AslCredentialRecord, VerifierError> {
        let argon2 = self.argon2_instance()?;
        // Canonicalization binds verifier input to both item values and their order.
        let canonical = canonicalize_selection(&selection.item_ids);
        // Random salt ensures equal sequences do not produce identical PHC strings.
        let salt = SaltString::generate(&mut OsRng);

        let password_hash = argon2
            .hash_password(canonical.as_slice(), &salt)
            .map_err(|err| VerifierError::HashBuild(err.to_string()))?
            .to_string();

        Ok(AslCredentialRecord {
            algorithm_version: self.config.algorithm_version,
            policy_version: self.config.policy_version,
            verifier_phc: password_hash,
        })
    }

    // & is a reference, get the original value without ownership
    pub fn verify(
        &self,
        selection: &LoginSelection,
        stored: &AslCredentialRecord,
    ) -> Result<bool, VerifierError> {
        let argon2 = self.argon2_instance()?;
        // login must canonicalize with the same algorithm as enrollment derivation
        let canonical = canonicalize_selection(&selection.item_ids);
        let parsed_hash = PasswordHash::new(stored.verifier_phc.as_str())
            .map_err(|err| VerifierError::InvalidStoredVerifier(err.to_string()))?;

        match argon2.verify_password(canonical.as_slice(), &parsed_hash) {
            // Wrong sequence is not an internal error; return false for normal auth failure.
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(err) => Err(VerifierError::VerificationInternal(err.to_string())),
        }
    }

    fn argon2_instance(&self) -> Result<Argon2<'static>, VerifierError> {
        // Centralized Argon2 construction keeps derive/verify parameter usage consistent.
        let params = Params::new(
            self.config.memory_kib,
            self.config.iterations,
            self.config.parallelism,
            None,
        )
        .map_err(|err| VerifierError::InvalidParams(err.to_string()))?;

        Ok(Argon2::new(Algorithm::Argon2id, Version::V0x13, params))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // test settings
    fn test_config() -> AslVerifierConfig {
        AslVerifierConfig {
            algorithm_version: 1,
            policy_version: 1,
            memory_kib: 8 * 1024,
            iterations: 2,
            parallelism: 1,
        }
    }

    #[::core::prelude::v1::test]
    // Matching enrollment/login sequences should authenticate successfully.
    fn derive_and_verify_matching_sequence() {
        let verifier = AslVerifier::new(test_config());
        let enrollment = EnrollmentSelection {
            item_ids: vec![1, 2, 3, 4, 5],
        };
        let login = LoginSelection {
            item_ids: vec![1, 2, 3, 4, 5],
        };

        let record = verifier.derive_verifier(&enrollment).unwrap();
        let is_valid = verifier.verify(&login, &record).unwrap();

        assert!(is_valid);
        assert!(record.verifier_phc.starts_with("$argon2id$"));
        assert_eq!(record.algorithm_version, 1);
        assert_eq!(record.policy_version, 1);
    }

    #[::core::prelude::v1::test]
    // Different ordering should fail because sequence order is part of the secret.
    fn verify_rejects_different_sequence() {
        let verifier = AslVerifier::new(test_config());
        let enrollment = EnrollmentSelection {
            item_ids: vec![1, 2, 3, 4, 5],
        };
        let login = LoginSelection {
            item_ids: vec![5, 4, 3, 2, 1],
        };

        let record = verifier.derive_verifier(&enrollment).unwrap();
        let is_valid = verifier.verify(&login, &record).unwrap();

        assert!(!is_valid);
    }

    #[::core::prelude::v1::test]
    // Corrupted persisted hashes should be rejected as parse errors.
    fn verify_rejects_invalid_stored_phc() {
        let verifier = AslVerifier::new(test_config());
        let login = LoginSelection {
            item_ids: vec![1, 2, 3, 4, 5],
        };
        let record = AslCredentialRecord {
            algorithm_version: 1,
            policy_version: 1,
            verifier_phc: "not-a-phc-string".to_string(),
        };

        let result = verifier.verify(&login, &record);

        assert!(matches!(
            result,
            Err(VerifierError::InvalidStoredVerifier(_))
        ));
    }
}
