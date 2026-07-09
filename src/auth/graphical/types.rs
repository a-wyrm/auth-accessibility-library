use serde::{Deserialize, Serialize};

/// Represents a single graphical password credential for a user
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GraphicalCredentialRecord {
    /// Algorithm version for future migrations
    pub algorithm_version: u16,
    /// Policy version for security policies
    pub policy_version: u16,
    /// Base64-encoded hash of the loved one's image
    pub loved_one_image_hash: String,
    /// ID of the secret animal pair
    pub secret_animal_id: String,
    /// PHC (Password Hashing Competition) string for verification
    pub verifier_phc: String,
}

/// Enrollment data during graphical password registration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphicalEnrollmentData {
    /// User ID
    pub user_id: String,
    /// User ID for verification
    pub lovedOneImgHash: String,
    /// Base64-encoded image data
    pub image_data: String,
    /// Animal selection ID
    pub animal_id: String,
}


pub struct GraphicalLexiconResponseItem {
    pub id: String,
    pub picture_hash: String,
    pub animal_hash: String,
}

/// Login verification input for graphical password
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphicalLoginInput {
    /// User ID
    pub user_id: String,
    /// Selected face image (from challenge grid)
    pub selected_face: String,
    /// Selected animal ID
    pub selected_animal_id: String,
}

/// Challenge grid response containing verification images
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphicalChallengeGrid {
    /// List of face image URLs/hashes for the challenge
    pub face_challenges: Vec<String>,
    /// List of animal IDs for selection
    pub animal_options: Vec<AnimalOption>,
}

/// Animal option for selection during challenge
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AnimalOption {
    pub id: String,
    pub name: String,
}

/// Verification result for graphical password
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphicalVerificationResult {
    pub success: bool,
    pub message: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graphical_credential_record_creation() {
        let record = GraphicalCredentialRecord {
            algorithm_version: 1,
            policy_version: 1,
            loved_one_image_hash: "hash123".to_string(),
            secret_animal_id: "a1".to_string(),
            verifier_phc: "phc_string".to_string(),
        };

        assert_eq!(record.algorithm_version, 1);
        assert_eq!(record.secret_animal_id, "a1");
    }
}
