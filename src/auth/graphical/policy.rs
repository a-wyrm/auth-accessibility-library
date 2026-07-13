use std::collections::HashSet;

use super::{GraphicalEnrollmentData, GraphicalLoginInput, GraphicalPasswordError};

#[derive(Debug, Clone, Copy)]
pub struct GraphicalPolicy {
    pub required_face_count: usize,
    pub required_animal_count: usize,
}

impl Default for GraphicalPolicy {
    fn default() -> Self {
        Self {
            required_face_count: 6,
            required_animal_count: 1,
        }
    }
}

impl GraphicalPolicy {
    pub fn validate_enrollment(
        &self,
        data: &GraphicalEnrollmentData,
    ) -> Result<(), GraphicalPasswordError> {
        if data.user_id.trim().is_empty() {
            return Err(GraphicalPasswordError::EnrollmentFailed(
                "User ID cannot be empty".to_string(),
            ));
        }

        if super::canonicalization::enrollment_secret(data).is_none() {
            return Err(GraphicalPasswordError::InvalidImageData);
        }

        if data.animal_id.trim().is_empty() {
            return Err(GraphicalPasswordError::EnrollmentFailed(
                "Animal selection cannot be empty".to_string(),
            ));
        }

        Ok(())
    }

    pub fn validate_login(
        &self,
        input: &GraphicalLoginInput,
    ) -> Result<(), GraphicalPasswordError> {
        if input.user_id.trim().is_empty() {
            return Err(GraphicalPasswordError::UserNotFound);
        }

        if input.selected_face.trim().is_empty() {
            return Err(GraphicalPasswordError::InvalidImageData);
        }

        if input.selected_animal_id.trim().is_empty() {
            return Err(GraphicalPasswordError::AnimalMismatch);
        }

        Ok(())
    }

    pub fn validate_face_grid(
        &self,
        face_challenges: &[String],
    ) -> Result<(), GraphicalPasswordError> {
        if face_challenges.len() < self.required_face_count {
            return Err(GraphicalPasswordError::VerificationFailed(format!(
                "expected at least {} face challenges",
                self.required_face_count
            )));
        }

        let mut seen = HashSet::with_capacity(face_challenges.len());
        for face in face_challenges {
            if !seen.insert(face) {
                return Err(GraphicalPasswordError::VerificationFailed(
                    "duplicate face challenges are not allowed".to_string(),
                ));
            }
        }

        Ok(())
    }
}
