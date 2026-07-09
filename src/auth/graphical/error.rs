use thiserror::Error;

#[derive(Debug, Error)]
pub enum GraphicalPasswordError {
    #[error("mongodb operation failed: {0}")]
    Mongo(#[from] mongodb::error::Error),

    #[error("user not found")]
    UserNotFound,

    #[error("invalid credentials")]
    InvalidCredentials,

    #[error("image hash mismatch")]
    ImageHashMismatch,

    #[error("animal selection mismatch")]
    AnimalMismatch,

    #[error("failed to hash image")]
    ImageHashingFailed,

    #[error("invalid image data")]
    InvalidImageData,

    #[error("enrollment failed: {0}")]
    EnrollmentFailed(String),

    #[error("verification failed: {0}")]
    VerificationFailed(String),
}
