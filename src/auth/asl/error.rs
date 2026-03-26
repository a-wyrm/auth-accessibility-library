use super::types::AslItemId;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PolicyError {
    // selection must be exactly policy-sized (no fewer and no extra gestures)
    #[error("selection must include exactly {expected} items, got {actual}")]
    InvalidSelectionSize { expected: usize, actual: usize },
    // duplicate ids are rejected to keep the passphrase sequence unambiguous
    #[error("selection contains duplicate item id: {item_id}")]
    DuplicateSelectionItem { item_id: AslItemId },
}