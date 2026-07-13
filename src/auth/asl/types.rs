// integer identifier for each lexicon entry
pub type AslItemId = u16;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EnrollmentSelection {
    // Ordered ids captured during signup.
    pub item_ids: Vec<AslItemId>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LoginSelection {
    // Ordered ids provided during login verification
    pub item_ids: Vec<AslItemId>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AslCredentialRecord {
    // Versions support future migrations without breaking existing records.
    pub algorithm_version: u16,
    pub policy_version: u16,
    // Argon2 PHC string storing algorithm parameters, salt, and hash.
    pub verifier_phc: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AslLexiconItem {
    pub id: AslItemId,
    pub locale: String,
    pub gesture_label: String,
    pub translation_label: String,
    pub active: bool,
    pub sort_order: i32,
}
