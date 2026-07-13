use serde::{Deserialize, Serialize};

pub fn graphical_animal_pool() -> Vec<AnimalOption> {
    vec![
        AnimalOption {
            id: "a1".to_string(),
            name: "Animal 1".to_string(),
        },
        AnimalOption {
            id: "a2".to_string(),
            name: "Animal 2".to_string(),
        },
        AnimalOption {
            id: "a3".to_string(),
            name: "Animal 3".to_string(),
        },
        AnimalOption {
            id: "a4".to_string(),
            name: "Animal 4".to_string(),
        },
        AnimalOption {
            id: "a5".to_string(),
            name: "Animal 5".to_string(),
        },
        AnimalOption {
            id: "a6".to_string(),
            name: "Animal 6".to_string(),
        },
    ]
}

pub const GRAPHICAL_DISTRACTOR_FACES: &[&str] = &[
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=60",
];

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
    /// animal array
    pub animal_array: Vec<String>,
}

/// Enrollment data during graphical password registration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicalEnrollmentData {
    /// User ID
    pub user_id: String,
    /// Hash or reference for the loved one's image.
    #[serde(default)]
    pub loved_one_img_hash: Option<String>,
    /// Raw image data or client-provided image reference.
    #[serde(default)]
    pub image_data: Option<String>,
    /// Animal selection ID
    pub animal_id: String,
    /// animal array
    #[serde(default)]
    pub animal_array: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicalLexiconResponseItem {
    pub id: String,
    pub picture_hash: String,
    pub animal_hash: String,
}

/// Login verification input for graphical password
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicalLoginInput {
    /// User ID
    pub user_id: String,
    /// Selected face image (from challenge grid)
    pub selected_face: String,
    /// Selected animal ID
    pub selected_animal_id: String,
    /// animal array
    #[serde(default)]
    pub animal_array: Vec<String>,
}

/// Challenge grid response containing verification images
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphicalChallengeGrid {
    /// List of face image URLs/hashes for the challenge
    pub face_challenges: Vec<String>,
    /// List of animal IDs for selection
    pub animal_options: Vec<AnimalOption>,
    /// User-specific animal ordering for the challenge
    pub animal_array: Vec<String>,
}

/// Animal option for selection during challenge
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AnimalOption {
    pub id: String,
    pub name: String,
}

/// Verification result for graphical password
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
            animal_array: vec!["a1".to_string()],
        };

        assert_eq!(record.algorithm_version, 1);
        assert_eq!(record.secret_animal_id, "a1");
    }
}
