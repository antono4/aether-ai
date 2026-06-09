use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum VoiceError {
    #[error("Audio processing error: {0}")]
    Processing(String),
    #[error("TTS engine error: {0}")]
    TTSEngine(String),
    #[error("STT engine error: {0}")]
    STTEngine(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceConfig {
    pub engine: VoiceEngine,
    pub voice_id: String,
    pub speed: f32,
    pub pitch: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VoiceEngine {
    Local,
    Cloud,
}

impl Default for VoiceConfig {
    fn default() -> Self {
        Self {
            engine: VoiceEngine::Local,
            voice_id: "default".to_string(),
            speed: 1.0,
            pitch: 1.0,
        }
    }
}