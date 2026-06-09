use keyring::Entry;
use serde::{Deserialize, Serialize};
use thiserror::Error;

const SERVICE_NAME: &str = "aether";

#[derive(Error, Debug)]
pub enum SecureStoreError {
    #[error("Access denied")]
    AccessDenied,
    #[error("Not found")]
    NotFound,
    #[error("Serialization error: {0}")]
    Serialization(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredCredential {
    pub key: String,
    pub value: String,
    pub created_at: i64,
}

pub struct SecureStore;

impl SecureStore {
    pub fn store(key: &str, value: &str) -> Result<(), SecureStoreError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|_| SecureStoreError::AccessDenied)?;
        entry.set_password(value)
            .map_err(|_| SecureStoreError::AccessDenied)
    }

    pub fn retrieve(key: &str) -> Result<String, SecureStoreError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|_| SecureStoreError::AccessDenied)?;
        entry.get_password().map_err(|e| match e {
            keyring::Error::NoEntry => SecureStoreError::NotFound,
            _ => SecureStoreError::AccessDenied,
        })
    }

    pub fn delete(key: &str) -> Result<(), SecureStoreError> {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|_| SecureStoreError::AccessDenied)?;
        entry.delete_credential()
            .map_err(|_| SecureStoreError::AccessDenied)
    }
}