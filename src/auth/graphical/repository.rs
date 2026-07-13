use mongodb::{
    bson::{doc, DateTime},
    options::UpdateOptions,
    Collection, Database,
};
use serde::{Deserialize, Serialize};

use super::error::GraphicalPasswordError;
use super::types::{GraphicalCredentialRecord, GraphicalLexiconResponseItem};

const GRAPHICAL_CREDENTIAL_COLLECTION: &str = "user_graphical_credentials";

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("mongodb operation failed: {0}")]
    Mongo(#[from] mongodb::error::Error),
}

#[derive(Debug, Clone)]
pub struct GraphicalCredentialRepository {
    credentials: Collection<GraphicalCredentialDocument>,
}

/// MongoDB document representation of graphical credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
struct GraphicalCredentialDocument {
    #[serde(rename = "_id")]
    user_id: String,
    algorithm_version: u16,
    policy_version: u16,
    loved_one_image_hash: String,
    secret_animal_id: String,
    verifier_phc: String,
    created_at: DateTime,
    updated_at: DateTime,
    animal_array: Vec<String>,
}

impl GraphicalCredentialRepository {
    /// Create a new graphical credential repository
    pub fn new(database: &Database) -> Self {
        Self {
            credentials: database.collection(GRAPHICAL_CREDENTIAL_COLLECTION),
        }
    }

    /// TODO: Change this hash
    pub async fn get_enrollment_lexicon(
        &self,
        _locale: &str,
    ) -> Result<Vec<GraphicalLexiconResponseItem>, GraphicalPasswordError> {
        Ok(vec![GraphicalLexiconResponseItem {
            id: "1".to_string(),
            picture_hash: "hash_abc123".to_string(),
            animal_hash: "hash_dog456".to_string(),
        }])
    }

    /// Store or update a user's graphical password credentials
    pub async fn upsert_credential(
        &self,
        user_id: &str,
        record: &GraphicalCredentialRecord,
    ) -> Result<(), GraphicalPasswordError> {
        let now = DateTime::now();
        let trimmed_id = user_id.trim();

        if trimmed_id.is_empty() {
            return Err(GraphicalPasswordError::EnrollmentFailed(
                "User ID cannot be empty".to_string(),
            ));
        }

        self.credentials
            .update_one(
                doc! { "_id": trimmed_id },
                doc! {
                    "$set": {
                        "algorithm_version": record.algorithm_version as i32,
                        "policy_version": record.policy_version as i32,
                        "loved_one_image_hash": &record.loved_one_image_hash,
                        "secret_animal_id": &record.secret_animal_id,
                        "verifier_phc": &record.verifier_phc,
                        "animal_array": &record.animal_array,
                        "updated_at": &now,
                    },
                    "$setOnInsert": {
                        "created_at": &now,
                    }
                },
                UpdateOptions::builder().upsert(true).build(),
            )
            .await?;

        log::info!(
            target: "graphical_password",
            "Credential upserted for user: {}",
            trimmed_id
        );

        Ok(())
    }

    /// Retrieve a user's graphical password credentials
    pub async fn get_credential(
        &self,
        user_id: &str,
    ) -> Result<Option<GraphicalCredentialRecord>, GraphicalPasswordError> {
        let trimmed_id = user_id.trim();

        let stored = self
            .credentials
            .find_one(doc! { "_id": trimmed_id }, None)
            .await?;

        Ok(stored.map(GraphicalCredentialRecord::from))
    }

    /// Delete a user's graphical password credentials
    pub async fn delete_credential(&self, user_id: &str) -> Result<bool, GraphicalPasswordError> {
        let trimmed_id = user_id.trim();

        let result = self
            .credentials
            .delete_one(doc! { "_id": trimmed_id }, None)
            .await?;

        Ok(result.deleted_count > 0)
    }

    /// Check if a user has registered graphical password credentials
    pub async fn user_exists(&self, user_id: &str) -> Result<bool, GraphicalPasswordError> {
        let trimmed_id = user_id.trim();

        let count = self
            .credentials
            .count_documents(doc! { "_id": trimmed_id }, None)
            .await?;

        Ok(count > 0)
    }
}

impl From<GraphicalCredentialDocument> for GraphicalCredentialRecord {
    fn from(doc: GraphicalCredentialDocument) -> Self {
        Self {
            algorithm_version: doc.algorithm_version,
            policy_version: doc.policy_version,
            loved_one_image_hash: doc.loved_one_image_hash,
            secret_animal_id: doc.secret_animal_id,
            verifier_phc: doc.verifier_phc,
            animal_array: doc.animal_array
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credential_document_conversion() {
        let doc = GraphicalCredentialDocument {
            user_id: "test_user".to_string(),
            algorithm_version: 1,
            policy_version: 1,
            loved_one_image_hash: "hash123".to_string(),
            secret_animal_id: "a1".to_string(),
            verifier_phc: "phc_string".to_string(),
            animal_array: vec!["a".to_string(), "b".into(), "c".into()],
            created_at: DateTime::now(),
            updated_at: DateTime::now(),
        };

        let record = GraphicalCredentialRecord::from(doc);
        assert_eq!(record.secret_animal_id, "a1");
        assert_eq!(record.algorithm_version, 1);
    }
}
