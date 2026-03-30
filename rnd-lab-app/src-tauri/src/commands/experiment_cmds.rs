use crate::db::AppDb;
use crate::models::*;
use tauri::State;

#[tauri::command]
pub fn list_experiments_by_project(
    db: State<AppDb>,
    project_id: i64,
) -> Result<Vec<Experiment>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, date, title, batch_code, objective, observation_md, result_summary
             FROM experiments WHERE project_id = ?1 ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], |row| {
            Ok(Experiment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                batch_code: row.get(4)?,
                objective: row.get(5)?,
                observation_md: row.get(6)?,
                result_summary: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_experiment(db: State<AppDb>, id: i64) -> Result<Experiment, String> {
    let conn = db.conn.lock().unwrap();
    conn.query_row(
        "SELECT id, project_id, date, title, batch_code, objective, observation_md, result_summary
         FROM experiments WHERE id = ?1",
        [id],
        |row| {
            Ok(Experiment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                batch_code: row.get(4)?,
                objective: row.get(5)?,
                observation_md: row.get(6)?,
                result_summary: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_experiment(db: State<AppDb>, data: CreateExperiment) -> Result<Experiment, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO experiments (project_id, date, title, batch_code, objective, observation_md, result_summary)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            data.project_id, data.date, data.title, data.batch_code,
            data.objective, data.observation_md, data.result_summary
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, project_id, date, title, batch_code, objective, observation_md, result_summary
         FROM experiments WHERE id = ?1",
        [id],
        |row| {
            Ok(Experiment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                batch_code: row.get(4)?,
                objective: row.get(5)?,
                observation_md: row.get(6)?,
                result_summary: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_experiment(db: State<AppDb>, id: i64, data: CreateExperiment) -> Result<Experiment, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "UPDATE experiments SET project_id=?1, date=?2, title=?3, batch_code=?4, objective=?5, observation_md=?6, result_summary=?7 WHERE id=?8",
        rusqlite::params![
            data.project_id, data.date, data.title, data.batch_code,
            data.objective, data.observation_md, data.result_summary, id
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, project_id, date, title, batch_code, objective, observation_md, result_summary FROM experiments WHERE id = ?1",
        [id],
        |row| {
            Ok(Experiment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                batch_code: row.get(4)?,
                objective: row.get(5)?,
                observation_md: row.get(6)?,
                result_summary: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

// --- Formulation Entries ---

#[tauri::command]
pub fn list_formulation_entries(
    db: State<AppDb>,
    experiment_id: i64,
) -> Result<Vec<FormulationEntry>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, experiment_id, material_name, amount, unit, role FROM formulation_entries WHERE experiment_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([experiment_id], |row| {
            Ok(FormulationEntry {
                id: row.get(0)?,
                experiment_id: row.get(1)?,
                material_name: row.get(2)?,
                amount: row.get(3)?,
                unit: row.get(4)?,
                role: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_formulation_entry(
    db: State<AppDb>,
    data: CreateFormulationEntry,
) -> Result<FormulationEntry, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO formulation_entries (experiment_id, material_name, amount, unit, role) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![data.experiment_id, data.material_name, data.amount, data.unit, data.role],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, experiment_id, material_name, amount, unit, role FROM formulation_entries WHERE id = ?1",
        [id],
        |row| Ok(FormulationEntry {
            id: row.get(0)?, experiment_id: row.get(1)?, material_name: row.get(2)?,
            amount: row.get(3)?, unit: row.get(4)?, role: row.get(5)?,
        }),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_formulation_entry(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM formulation_entries WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Process Conditions ---

#[tauri::command]
pub fn list_process_conditions(
    db: State<AppDb>,
    experiment_id: i64,
) -> Result<Vec<ProcessCondition>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, experiment_id, temperature, mixing_time, mixing_speed, ph, aging_time, memo FROM process_conditions WHERE experiment_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([experiment_id], |row| {
            Ok(ProcessCondition {
                id: row.get(0)?,
                experiment_id: row.get(1)?,
                temperature: row.get(2)?,
                mixing_time: row.get(3)?,
                mixing_speed: row.get(4)?,
                ph: row.get(5)?,
                aging_time: row.get(6)?,
                memo: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_process_condition(
    db: State<AppDb>,
    data: CreateProcessCondition,
) -> Result<ProcessCondition, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO process_conditions (experiment_id, temperature, mixing_time, mixing_speed, ph, aging_time, memo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![data.experiment_id, data.temperature, data.mixing_time, data.mixing_speed, data.ph, data.aging_time, data.memo],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, experiment_id, temperature, mixing_time, mixing_speed, ph, aging_time, memo FROM process_conditions WHERE id = ?1",
        [id],
        |row| Ok(ProcessCondition {
            id: row.get(0)?, experiment_id: row.get(1)?, temperature: row.get(2)?,
            mixing_time: row.get(3)?, mixing_speed: row.get(4)?, ph: row.get(5)?,
            aging_time: row.get(6)?, memo: row.get(7)?,
        }),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_process_condition(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM process_conditions WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Property Measurements ---

#[tauri::command]
pub fn list_property_measurements(
    db: State<AppDb>,
    experiment_id: i64,
) -> Result<Vec<PropertyMeasurement>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, experiment_id, property_name, value, unit, test_method, memo FROM property_measurements WHERE experiment_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([experiment_id], |row| {
            Ok(PropertyMeasurement {
                id: row.get(0)?,
                experiment_id: row.get(1)?,
                property_name: row.get(2)?,
                value: row.get(3)?,
                unit: row.get(4)?,
                test_method: row.get(5)?,
                memo: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_property_measurements_by_project(
    db: State<AppDb>,
    project_id: i64,
) -> Result<Vec<PropertyMeasurement>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT pm.id, pm.experiment_id, pm.property_name, pm.value, pm.unit, pm.test_method, pm.memo
             FROM property_measurements pm
             JOIN experiments e ON pm.experiment_id = e.id
             WHERE e.project_id = ?1
             ORDER BY pm.property_name, e.date",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], |row| {
            Ok(PropertyMeasurement {
                id: row.get(0)?,
                experiment_id: row.get(1)?,
                property_name: row.get(2)?,
                value: row.get(3)?,
                unit: row.get(4)?,
                test_method: row.get(5)?,
                memo: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_property_measurement(
    db: State<AppDb>,
    data: CreatePropertyMeasurement,
) -> Result<PropertyMeasurement, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO property_measurements (experiment_id, property_name, value, unit, test_method, memo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![data.experiment_id, data.property_name, data.value, data.unit, data.test_method, data.memo],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, experiment_id, property_name, value, unit, test_method, memo FROM property_measurements WHERE id = ?1",
        [id],
        |row| Ok(PropertyMeasurement {
            id: row.get(0)?, experiment_id: row.get(1)?, property_name: row.get(2)?,
            value: row.get(3)?, unit: row.get(4)?, test_method: row.get(5)?, memo: row.get(6)?,
        }),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_property_measurement(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM property_measurements WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Recent experiments for dashboard ---

#[tauri::command]
pub fn list_recent_experiments(db: State<AppDb>, limit: i64) -> Result<Vec<Experiment>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, date, title, batch_code, objective, observation_md, result_summary
             FROM experiments ORDER BY date DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([limit], |row| {
            Ok(Experiment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                title: row.get(3)?,
                batch_code: row.get(4)?,
                objective: row.get(5)?,
                observation_md: row.get(6)?,
                result_summary: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
