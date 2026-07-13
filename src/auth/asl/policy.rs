use std::collections::HashSet;

use super::error::PolicyError;
use super::types::{EnrollmentSelection, LoginSelection};

#[derive(Debug, Clone, Copy)]
pub struct AslPolicy {
    // Current ASL policy requires exactly N unique items.
    pub required_selection_size: usize,
}

impl Default for AslPolicy {
    fn default() -> Self {
        Self {
            required_selection_size: 5,
        }
    }
}

impl AslPolicy {
    pub fn validate_enrollment(&self, selection: &EnrollmentSelection) -> Result<(), PolicyError> {
        // Enrollment and login share the same structural validation rules.
        self.validate_item_ids(selection.item_ids.as_slice())
    }

    pub fn validate_login(&self, selection: &LoginSelection) -> Result<(), PolicyError> {
        self.validate_item_ids(selection.item_ids.as_slice())
    }

    fn validate_item_ids(&self, item_ids: &[u16]) -> Result<(), PolicyError> {
        if item_ids.len() != self.required_selection_size {
            return Err(PolicyError::InvalidSelectionSize {
                expected: self.required_selection_size,
                actual: item_ids.len(),
            });
        }

        // Reject repeated item ids to avoid weakening sequence entropy.
        let mut seen = HashSet::with_capacity(item_ids.len());
        for item_id in item_ids {
            if !seen.insert(*item_id) {
                return Err(PolicyError::DuplicateSelectionItem { item_id: *item_id });
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    // Happy path: exact count and uniqueness should pass.
    fn validate_enrollment_accepts_five_unique_items() {
        let policy = AslPolicy::default();
        let selection = EnrollmentSelection {
            item_ids: vec![1, 3, 5, 7, 9],
        };

        assert!(policy.validate_enrollment(&selection).is_ok());
    }

    #[test]
    // Fewer than required items should fail with explicit size details.
    fn validate_login_rejects_wrong_size() {
        let policy = AslPolicy::default();
        let selection = LoginSelection {
            item_ids: vec![1, 3, 5, 7],
        };

        assert_eq!(
            policy.validate_login(&selection),
            Err(PolicyError::InvalidSelectionSize {
                expected: 5,
                actual: 4,
            })
        );
    }

    #[test]
    // Duplicate item ids should fail even if total count is correct.
    fn validate_login_rejects_duplicates() {
        let policy = AslPolicy::default();
        let selection = LoginSelection {
            item_ids: vec![2, 4, 4, 6, 8],
        };

        assert_eq!(
            policy.validate_login(&selection),
            Err(PolicyError::DuplicateSelectionItem { item_id: 4 })
        );
    }
}
