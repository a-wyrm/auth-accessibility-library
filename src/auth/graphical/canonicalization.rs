use super::types::GraphicalEnrollmentData;

const DOMAIN_SEPARATOR: &str = "graphical-v1";

pub fn canonicalize_graphical_selection(face: &str, animal_id: &str) -> Vec<u8> {
    let mut out = String::with_capacity(DOMAIN_SEPARATOR.len() + face.len() + animal_id.len() + 2);
    out.push_str(DOMAIN_SEPARATOR);
    out.push(':');
    out.push_str(face.trim());
    out.push(':');
    out.push_str(animal_id.trim());
    out.into_bytes()
}

pub fn enrollment_secret(data: &GraphicalEnrollmentData) -> Option<String> {
    data.loved_one_img_hash
        .clone()
        .or_else(|| data.image_data.clone())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::canonicalize_graphical_selection;

    #[test]
    fn canonicalization_is_versioned_and_ordered() {
        let bytes = canonicalize_graphical_selection("face-1", "a1");

        assert_eq!(bytes, b"graphical-v1:face-1:a1");
    }
}
