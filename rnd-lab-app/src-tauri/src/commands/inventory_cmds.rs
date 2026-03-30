use crate::db::AppDb;
use crate::models::{CreateInventoryLog, InventoryLog, UpdateTestResult};
use tauri::State;

const SELECT_COLS: &str =
    "id, item_name, log_type, sub_type, quantity, unit, date, purpose, project_id, experiment_id, memo, \
     provider, usage_desc, unit_price, form_factor, total_amount, \
     recipient_dept, recipient_name, lot, test_content, test_result";

fn row_to_inventory_log(row: &rusqlite::Row) -> rusqlite::Result<InventoryLog> {
    Ok(InventoryLog {
        id: row.get(0)?,
        item_name: row.get(1)?,
        log_type: row.get(2)?,
        sub_type: row.get(3)?,
        quantity: row.get(4)?,
        unit: row.get(5)?,
        date: row.get(6)?,
        purpose: row.get(7)?,
        project_id: row.get(8)?,
        experiment_id: row.get(9)?,
        memo: row.get(10)?,
        provider: row.get(11)?,
        usage_desc: row.get(12)?,
        unit_price: row.get(13)?,
        form_factor: row.get(14)?,
        total_amount: row.get(15)?,
        recipient_dept: row.get(16)?,
        recipient_name: row.get(17)?,
        lot: row.get(18)?,
        test_content: row.get(19)?,
        test_result: row.get(20)?,
    })
}

#[tauri::command]
pub fn list_inventory_logs(
    db: State<AppDb>,
    start: Option<String>,
    end: Option<String>,
    item_name: Option<String>,
    project_id: Option<i64>,
    sub_type: Option<String>,
) -> Result<Vec<InventoryLog>, String> {
    let conn = db.conn.lock().unwrap();

    let mut sql = format!("SELECT {} FROM inventory_logs WHERE 1=1", SELECT_COLS);
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
    if let Some(ref st) = sub_type {
        sql.push_str(" AND sub_type = ?");
        params.push(Box::new(st.clone()));
    }

    sql.push_str(" ORDER BY date DESC, id DESC");

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(param_refs.as_slice(), |row| row_to_inventory_log(row))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recent_inventory_logs(db: State<AppDb>, limit: i64) -> Result<Vec<InventoryLog>, String> {
    let conn = db.conn.lock().unwrap();
    let sql = format!(
        "SELECT {} FROM inventory_logs ORDER BY date DESC, id DESC LIMIT ?1",
        SELECT_COLS
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([limit], |row| row_to_inventory_log(row))
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
        "INSERT INTO inventory_logs (
            item_name, log_type, sub_type, quantity, unit, date, purpose,
            project_id, experiment_id, memo,
            provider, usage_desc, unit_price, form_factor, total_amount,
            recipient_dept, recipient_name, lot, test_content, test_result
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20)",
        rusqlite::params![
            data.item_name, data.log_type, data.sub_type, data.quantity, data.unit,
            data.date, data.purpose, data.project_id, data.experiment_id, data.memo,
            data.provider, data.usage_desc, data.unit_price, data.form_factor, data.total_amount,
            data.recipient_dept, data.recipient_name, data.lot, data.test_content, data.test_result
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let sql = format!("SELECT {} FROM inventory_logs WHERE id = ?1", SELECT_COLS);
    conn.query_row(&sql, [id], |row| row_to_inventory_log(row))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_inventory_test_result(
    db: State<AppDb>,
    data: UpdateTestResult,
) -> Result<InventoryLog, String> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "UPDATE inventory_logs SET test_result = ?1 WHERE id = ?2",
        rusqlite::params![data.test_result, data.id],
    )
    .map_err(|e| e.to_string())?;
    let sql = format!("SELECT {} FROM inventory_logs WHERE id = ?1", SELECT_COLS);
    conn.query_row(&sql, [data.id], |row| row_to_inventory_log(row))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_inventory_log(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().unwrap();
    conn.execute("DELETE FROM inventory_logs WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
