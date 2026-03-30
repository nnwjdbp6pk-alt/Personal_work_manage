use crate::db::AppDb;
use crate::models::{CreateTask, Task};
use tauri::State;

#[tauri::command]
pub fn list_tasks_by_date_range(
    db: State<AppDb>,
    start: String,
    end: String,
) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, date, title, description, status, priority, project_id
             FROM tasks WHERE date >= ?1 AND date <= ?2 ORDER BY date ASC, priority DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![start, end], |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                project_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_tasks_by_project(db: State<AppDb>, project_id: i64) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, date, title, description, status, priority, project_id
             FROM tasks WHERE project_id = ?1 ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                project_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_task(db: State<AppDb>, data: CreateTask) -> Result<Task, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO tasks (date, title, description, status, priority, project_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![data.date, data.title, data.description, data.status, data.priority, data.project_id],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, date, title, description, status, priority, project_id FROM tasks WHERE id = ?1",
        [id],
        |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                project_id: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_task(db: State<AppDb>, id: i64, data: CreateTask) -> Result<Task, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "UPDATE tasks SET date=?1, title=?2, description=?3, status=?4, priority=?5, project_id=?6 WHERE id=?7",
        rusqlite::params![data.date, data.title, data.description, data.status, data.priority, data.project_id, id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, date, title, description, status, priority, project_id FROM tasks WHERE id = ?1",
        [id],
        |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                project_id: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_task(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM tasks WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
