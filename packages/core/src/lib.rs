use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Error, Debug)]
pub enum CoreError {
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid operation: {0}")]
    InvalidOperation(String),
    #[error("Storage error: {0}")]
    StorageError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
    Tool,
}

impl Conversation {
    pub fn new(title: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            messages: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn add_message(&mut self, role: MessageRole, content: String) -> Message {
        let msg = Message {
            id: Uuid::new_v4().to_string(),
            role,
            content,
            timestamp: Utc::now(),
        };
        self.messages.push(msg.clone());
        self.updated_at = Utc::now();
        msg
    }
}

pub struct Context {
    conversations: Arc<RwLock<Vec<Conversation>>>,
}

impl Context {
    pub fn new() -> Self {
        Self {
            conversations: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn create_conversation(&self, title: String) -> Conversation {
        let conv = Conversation::new(title);
        self.conversations.write().await.push(conv.clone());
        conv
    }

    pub async fn get_conversation(&self, id: &str) -> Result<Conversation, CoreError> {
        self.conversations
            .read()
            .await
            .iter()
            .find(|c| c.id == id)
            .cloned()
            .ok_or_else(|| CoreError::NotFound(format!("Conversation {}", id)))
    }

    pub async fn list_conversations(&self) -> Vec<Conversation> {
        self.conversations.read().await.clone()
    }

    pub async fn delete_conversation(&self, id: &str) -> Result<(), CoreError> {
        let mut convs = self.conversations.write().await;
        let pos = convs
            .iter()
            .position(|c| c.id == id)
            .ok_or_else(|| CoreError::NotFound(id.to_string()))?;
        convs.remove(pos);
        Ok(())
    }
}

impl Default for Context {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_conversation() {
        let ctx = Context::new();
        let conv = ctx.create_conversation("Test".to_string()).await;
        assert!(!conv.id.is_empty());
        assert_eq!(conv.title, "Test");
    }

    #[tokio::test]
    async fn test_add_message() {
        let ctx = Context::new();
        let mut conv = ctx.create_conversation("Test".to_string()).await;
        let msg = conv.add_message(MessageRole::User, "Hello".to_string());
        assert_eq!(msg.content, "Hello");
    }
}