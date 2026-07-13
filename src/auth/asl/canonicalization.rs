use super::types::AslItemId;

// domain separation prevents collisions with other potential auth encodings
const DOMAIN_SEPARATOR: &str = "asl-v1";

pub fn canonicalize_selection(item_ids: &[AslItemId]) -> Vec<u8> {
    // Allocate once for predictable formatting: "asl-v1:" + comma-separated ids.
    let mut out = String::with_capacity(16 + item_ids.len() * 6);
    out.push_str(DOMAIN_SEPARATOR);
    out.push(':');

    // Preserve input order intentionally, sequence order is part of the secret.
    for (index, item_id) in item_ids.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        out.push_str(item_id.to_string().as_str());
    }

    out.into_bytes()
}

// tests for caonicalizations
#[cfg(test)]
mod tests {
    use super::canonicalize_selection;

    #[::core::prelude::v1::test]
    // ensures deterministic format and versioned prefix
    fn canonicalization_includes_domain_separator_and_order() {
        let bytes = canonicalize_selection(&[11, 13, 17, 19, 23]);

        assert_eq!(bytes, b"asl-v1:11,13,17,19,23");
    }

    #[::core::prelude::v1::test]
    // debug test that confirms that reordering items changes the canonicalized value
    fn canonicalization_differs_when_order_changes() {
        let first = canonicalize_selection(&[1, 2, 3, 4, 5]);
        let second = canonicalize_selection(&[5, 4, 3, 2, 1]);

        assert_ne!(first, second);
    }
}
