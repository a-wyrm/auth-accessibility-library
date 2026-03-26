use mongodb::{
    bson::{doc, DateTime},
    options::{FindOptions, UpdateOptions},
    Collection, Database,
};

use super::types::{AslCredentialRecord, AslItemId, AslLexiconItem};

const CREDENTIAL_COLLECTION: &str = "user_asl_credentials";
const LEXICON_COLLECTION: &str = "asl_lexicon";

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("mongodb operation failed: {0}")]
    Mongo(#[from] mongodb::error::Error),
}

#[derive(Debug, Clone)]
pub struct AslRepository {
    credentials: Collection<AslCredentialDocument>,
    lexicon: Collection<AslLexiconDocument>,
}

impl AslRepository {
    pub fn new(database: &Database) -> Self {
        Self {
            credentials: database.collection(CREDENTIAL_COLLECTION),
            lexicon: database.collection(LEXICON_COLLECTION),
        }
    }

    pub async fn upsert_credential(
        &self,
        user_id: &str,
        record: &AslCredentialRecord,
    ) -> Result<(), RepositoryError> {
        let now = DateTime::now();
        self.credentials
            .update_one(
                doc! { "_id": user_id },
                doc! {
                    "$set": {
                        "algorithm_version": i32::from(record.algorithm_version),
                        "policy_version": i32::from(record.policy_version),
                        "verifier_phc": &record.verifier_phc,
                        "updated_at": &now,
                    },
                    "$setOnInsert": {
                        "created_at": &now,
                    }
                },
                UpdateOptions::builder().upsert(true).build(),
            )
            .await?;

        Ok(())
    }

    pub async fn get_credential(
        &self,
        user_id: &str,
    ) -> Result<Option<AslCredentialRecord>, RepositoryError> {
        let stored = self.credentials.find_one(doc! { "_id": user_id }, None).await?;
        Ok(stored.map(AslCredentialRecord::from))
    }

    pub async fn list_active_lexicon(
        &self,
        locale: &str,
    ) -> Result<Vec<AslLexiconItem>, RepositoryError> {
        let mut cursor = self
            .lexicon
            .find(
                doc! {
                    "locale": locale,
                    "active": true,
                },
                FindOptions::builder()
                    .sort(doc! { "sort_order": 1, "_id": 1 })
                    .build(),
            )
            .await?;

        let mut items = Vec::new();
        while cursor.advance().await? {
            let item = cursor.deserialize_current()?;
            items.push(AslLexiconItem::from(item));
        }

        Ok(items)
    }

    pub async fn seed_lexicon_if_empty(
        &self,
        items: &[AslLexiconItem],
    ) -> Result<usize, RepositoryError> {
        let current_count = self.lexicon.count_documents(doc! {}, None).await?;
        if current_count > 0 {
            return Ok(0);
        }

        if items.is_empty() {
            return Ok(0);
        }

        let documents: Vec<AslLexiconDocument> =
            items.iter().cloned().map(AslLexiconDocument::from).collect();

        let result = self.lexicon.insert_many(documents, None).await?;
        Ok(result.inserted_ids.len())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AslCredentialDocument {
    #[serde(rename = "_id")]
    user_id: String,
    algorithm_version: u16,
    policy_version: u16,
    verifier_phc: String,
    created_at: DateTime,
    updated_at: DateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AslLexiconDocument {
    #[serde(rename = "_id")]
    id: AslItemId,
    locale: String,
    gesture_label: String,
    translation_label: String,
    active: bool,
    sort_order: i32,
}

impl From<AslCredentialDocument> for AslCredentialRecord {
    fn from(value: AslCredentialDocument) -> Self {
        Self {
            algorithm_version: value.algorithm_version,
            policy_version: value.policy_version,
            verifier_phc: value.verifier_phc,
        }
    }
}

impl From<AslLexiconDocument> for AslLexiconItem {
    fn from(value: AslLexiconDocument) -> Self {
        Self {
            id: value.id,
            locale: value.locale,
            gesture_label: value.gesture_label,
            translation_label: value.translation_label,
            active: value.active,
            sort_order: value.sort_order,
        }
    }
}

impl From<AslLexiconItem> for AslLexiconDocument {
    fn from(value: AslLexiconItem) -> Self {
        Self {
            id: value.id,
            locale: value.locale,
            gesture_label: value.gesture_label,
            translation_label: value.translation_label,
            active: value.active,
            sort_order: value.sort_order,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[::core::prelude::v1::test]
    fn lexicon_item_conversion_roundtrip() {
        let item = AslLexiconItem {
            id: 7,
            locale: "en-US".to_string(),
            gesture_label: "TWO-FINGERS-EYES".to_string(),
            translation_label: "See".to_string(),
            active: true,
            sort_order: 7,
        };

        let document = AslLexiconDocument::from(item.clone());
        let converted = AslLexiconItem::from(document);

        assert_eq!(item, converted);
    }
}
