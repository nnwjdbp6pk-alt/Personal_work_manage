use crate::db::AppDb;
use crate::models::{CreateInventoryLog, InventoryLog};
use tauri::State;

#[tauri::command]
pub fn list_inventory_logs(
    db: State<AppDb>,
    start: Option<String>,
    end: Option<String>,
    item_name: Option<String>,
    project_id: Option<i64>,
) -> Result<Vec<InventoryLog>, String> {
    let conn = db.conn.lock().unwrap();

    let mut sql = String::from(
        "SELECT id, item_name, log_type, quantity, unit, date, purpose, project_id, experiment_id, memo
         FROM inventory_logs WHERE 1=1",
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    if let Some(ref s) = start {
        sql.push_str(" AND date >= ?");
        params.push(Box::new(s.clone()));
    }
    if let Some(ref e) = end {
        sql.push_str(" AND date <= ?");
        params.push(Box::new(e.clone()));
    }
    if let Some(ref name) = item_name {
        sql.push_str(" AND item_name LIKE ?");
        params.push(Box::new(format!("%{}%", name)));
    }
    if let Some(pid) = project_id {
        sql.push_str(" AND project_id = ?");
        params.push(Box::new(pid));
    }

    sql.push_str(" ORDER BY date DESC, id DESC");

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(InventoryLog {
                id: row.get(0)?,
                item_name: row.get(1)?,
                log_type: row.get(2)?,
                quantity: row.get(3)?,
                unit: row.get(4)?,
                date: row.get(5)?,
                purpose: row.get(6)?,
                project_id: row.get(7)?,
                experiment_id: row.get(8)?,
                memo: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recent_inventory_logs(db: State<AppDb>, limit: i64) -> Result<Vec<InventoryLog>, String> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, item_name, log_type, quantity, unit, date, purpose, project_id, experiment_id, memo
             FROM inventory_logs ORDER BY date DESC, id DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([limit], |row| {
            Ok(InventoryLog {
                id: row.get(0)?,
                item_name: row.get(1)?,
                log_type: row.get(2)?,
                quantity: row.get(3)?,
                unit: row.get(4)?,
                date: row.get(5)?,
                purpose: row.get(6)?,
                project_id: row.get(7)?,
                experiment_id: row.get(8)?,
                memo: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_inventory_log(
    db: State<AppDb>,
    data: CreateInventoryLog,
) -> Result<InventoryLog, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO inventory_logs (item_name, log_type, quantity, unit, date, purpose, project_id, experiment_id, memo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            data.item_name, data.log_type, data.quantity, data.unit,
            data.date, data.purpose, data.project_id, data.experiment_id, data.memo
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, item_name, log_type, quantity, unit, date, purpose, project_id, experiment_id, memo
         FROM inventory_logs WHERE id = ?1",
        [id],
        |row| {
            Ok(InventoryLog {
                id: row.get(0)?, item_name: row.get(1)?, log_type: row.get(2)?,
                quantity: row.get(3)?, unit: row.get(4)?, date: row.get(5)?,
                purpose: row.get(6)?, project_id: row.get(7)?, experiment_id: row.get(8)?,
                memo: row.get(9)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_inventory_log(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM inventory_logs WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
