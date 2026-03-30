use crate::db::AppDb;
use crate::models::{CreateProject, Project};
use tauri::State;

#[tauri::command]
pub fn list_projects(db: State<AppDb>) -> Result<Vec<Project>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, description, status, created_at, updated_at FROM projects ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(db: State<AppDb>, id: i64) -> Result<Project, String> {
    let conn = db.conn.lock().unwrap();
    conn.query_row(
        "SELECT id, name, description, status, created_at, updated_at FROM projects WHERE id = ?1",
        [id],
        |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(db: State<AppDb>, data: CreateProject) -> Result<Project, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO projects (name, description, status) VALUES (?1, ?2, ?3)",
        rusqlite::params![data.name, data.description, data.status],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    drop(conn);
    get_project(db, id)
}

#[tauri::command]
pub fn update_project(db: State<AppDb>, id: i64, data: CreateProject) -> Result<Project, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, status = ?3, updated_at = datetime('now', 'localtime') WHERE id = ?4",
        rusqlite::params![data.name, data.description, data.status, id],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_project(db, id)
}

#[tauri::command]
pub fn delete_project(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM projects WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
