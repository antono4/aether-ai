use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Error, Debug)]
pub enum SchedulerError {
    #[error("Job not found: {0}")]
    NotFound(String),
    #[error("Job already running")]
    AlreadyRunning,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: String,
    pub name: String,
    pub schedule: Schedule,
    pub enabled: bool,
    pub last_run: Option<DateTime<Utc>>,
    pub next_run: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Schedule {
    Once { at: DateTime<Utc> },
    Interval { seconds: u64 },
    Cron { expression: String },
}

impl Job {
    pub fn new(name: String, schedule: Schedule) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            schedule,
            enabled: true,
            last_run: None,
            next_run: None,
        }
    }
}

pub struct Scheduler {
    jobs: std::collections::HashMap<String, Job>,
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            jobs: std::collections::HashMap::new(),
        }
    }

    pub fn add_job(&mut self, job: Job) -> String {
        let id = job.id.clone();
        self.jobs.insert(id.clone(), job);
        id
    }

    pub fn remove_job(&mut self, id: &str) -> Option<Job> {
        self.jobs.remove(id)
    }

    pub fn get_job(&self, id: &str) -> Option<&Job> {
        self.jobs.get(id)
    }

    pub fn list_jobs(&self) -> Vec<&Job> {
        self.jobs.values().collect()
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}