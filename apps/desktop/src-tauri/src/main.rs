#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: DateTime<Utc>,
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
pub struct AppConfig {
    pub api_url: String,
    pub model: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub voice_enabled: bool,
    pub memory_enabled: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_url: "http://localhost:4000".to_string(),
            model: "claude-3-5-sonnet".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
            voice_enabled: false,
            memory_enabled: true,
        }
    }
}

struct AppState {
    conversations: Mutex<Vec<Conversation>>,
    config: Mutex<AppConfig>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            conversations: Mutex::new(Vec::new()),
            config: Mutex::new(AppConfig::default()),
        }
    }
}

#[tauri::command]
fn get_conversations(state: tauri::State<AppState>) -> Vec<Conversation> {
    state.conversations.lock().unwrap().clone()
}

#[tauri::command]
fn create_conversation(state: tauri::State<AppState>, title: String) -> Conversation {
    let now = Utc::now();
    let conv = Conversation {
        id: Uuid::new_v4().to_string(),
        title,
        messages: Vec::new(),
        created_at: now,
        updated_at: now,
    };
    state.conversations.lock().unwrap().push(conv.clone());
    conv
}

#[tauri::command]
fn delete_conversation(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let mut convs = state.conversations.lock().unwrap();
    let pos = convs.iter().position(|c| c.id == id).ok_or("Not found")?;
    convs.remove(pos);
    Ok(())
}

#[tauri::command]
fn send_message(state: tauri::State<AppState>, conversation_id: String, content: String) -> Result<Message, String> {
    let mut convs = state.conversations.lock().unwrap();
    let conv = convs.iter_mut().find(|c| c.id == conversation_id).ok_or("Conversation not found")?;
    
    let msg = Message {
        id: Uuid::new_v4().to_string(),
        role: "user".to_string(),
        content: content.clone(),
        timestamp: Utc::now(),
    };
    conv.messages.push(msg.clone());
    conv.updated_at = Utc::now();
    
    // Simulate AI response
    let response = Message {
        id: Uuid::new_v4().to_string(),
        role: "assistant".to_string(),
        content: format!("Echo: {}", content),
        timestamp: Utc::now(),
    };
    conv.messages.push(response.clone());
    conv.updated_at = Utc::now();
    
    Ok(msg)
}

#[tauri::command]
fn get_config(state: tauri::State<AppState>) -> AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn set_config(state: tauri::State<AppState>, config: AppConfig) {
    *state.config.lock().unwrap() = config;
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("aether=info")
        .init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_conversations,
            create_conversation,
            delete_conversation,
            send_message,
            get_config,
            set_config,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_title("Aether").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}