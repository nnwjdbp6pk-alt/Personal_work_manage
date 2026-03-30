use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProject {
    pub name: String,
    pub description: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
    pub date: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub project_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTask {
    pub date: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Experiment {
    pub id: i64,
    pub project_id: i64,
    pub date: String,
    pub title: String,
    pub batch_code: String,
    pub objective: String,
    pub observation_md: String,
    pub result_summary: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateExperiment {
    pub project_id: i64,
    pub date: String,
    pub title: String,
    pub batch_code: String,
    pub objective: String,
    pub observation_md: String,
    pub result_summary: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FormulationEntry {
    pub id: i64,
    pub experiment_id: i64,
    pub material_name: String,
    pub amount: f64,
    pub unit: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFormulationEntry {
    pub experiment_id: i64,
    pub material_name: String,
    pub amount: f64,
    pub unit: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessCondition {
    pub id: i64,
    pub experiment_id: i64,
    pub temperature: Option<f64>,
    pub mixing_time: Option<f64>,
    pub mixing_speed: Option<f64>,
    pub ph: Option<f64>,
    pub aging_time: Option<f64>,
    pub memo: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProcessCondition {
    pub experiment_id: i64,
    pub temperature: Option<f64>,
    pub mixing_time: Option<f64>,
    pub mixing_speed: Option<f64>,
    pub ph: Option<f64>,
    pub aging_time: Option<f64>,
    pub memo: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PropertyMeasurement {
    pub id: i64,
    pub experiment_id: i64,
    pub property_name: String,
    pub value: f64,
    pub unit: String,
    pub test_method: String,
    pub memo: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePropertyMeasurement {
    pub experiment_id: i64,
    pub property_name: String,
    pub value: f64,
    pub unit: String,
    pub test_method: String,
    pub memo: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryLog {
    pub id: i64,
    pub item_name: String,
    pub log_type: String,
    pub quantity: f64,
    pub unit: String,
    pub date: String,
    pub purpose: String,
    pub project_id: Option<i64>,
    pub experiment_id: Option<i64>,
    pub memo: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateInventoryLog {
    pub item_name: String,
    pub log_type: String,
    pub quantity: f64,
    pub unit: String,
    pub date: String,
    pub purpose: String,
    pub project_id: Option<i64>,
    pub experiment_id: Option<i64>,
    pub memo: String,
}
