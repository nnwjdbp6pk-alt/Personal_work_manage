use crate::db::AppDb;
use tauri::State;

#[tauri::command]
pub fn generate_weekly_summary_md(
    db: State<AppDb>,
    start: String,
    end: String,
) -> Result<String, String> {
    let conn = db.conn.lock().unwrap();

    let mut md = format!("# 주간 업무 요약 ({} ~ {})\n\n", start, end);

    // Tasks
    md.push_str("## 업무 목록\n\n");
    md.push_str("| 날짜 | 제목 | 상태 | 우선순위 |\n");
    md.push_str("|------|------|------|----------|\n");

    let mut stmt = conn
        .prepare("SELECT date, title, status, priority FROM tasks WHERE date >= ?1 AND date <= ?2 ORDER BY date")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![start, end], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (date, title, status, priority) = row.map_err(|e| e.to_string())?;
        let status_icon = match status.as_str() {
            "done" => "✅",
            "in_progress" => "🔄",
            _ => "⬜",
        };
        md.push_str(&format!("| {} | {} | {} | {} |\n", date, title, status_icon, priority));
    }

    // Experiments
    md.push_str("\n## 실험 기록\n\n");
    let mut stmt = conn
        .prepare(
            "SELECT e.date, e.title, e.batch_code, e.result_summary, p.name
             FROM experiments e JOIN projects p ON e.project_id = p.id
             WHERE e.date >= ?1 AND e.date <= ?2 ORDER BY e.date",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![start, end], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (date, title, batch, summary, project) = row.map_err(|e| e.to_string())?;
        md.push_str(&format!("### {} - {} ({})\n", date, title, batch));
        md.push_str(&format!("- **프로젝트**: {}\n", project));
        if !summary.is_empty() {
            md.push_str(&format!("- **결과**: {}\n", summary));
        }
        md.push('\n');
    }

    // Inventory
    md.push_str("## 입출고 기록\n\n");
    md.push_str("| 날짜 | 품목 | 구분 | 수량 | 목적 |\n");
    md.push_str("|------|------|------|------|------|\n");
    let mut stmt = conn
        .prepare(
            "SELECT date, item_name, log_type, quantity, unit, purpose FROM inventory_logs
             WHERE date >= ?1 AND date <= ?2 ORDER BY date",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![start, end], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (date, item, log_type, qty, unit, purpose) = row.map_err(|e| e.to_string())?;
        let type_label = if log_type == "IN" { "입고" } else { "출고" };
        md.push_str(&format!("| {} | {} | {} | {}{} | {} |\n", date, item, type_label, qty, unit, purpose));
    }

    Ok(md)
}

#[tauri::command]
pub fn export_project_experiments_csv(
    db: State<AppDb>,
    project_id: i64,
) -> Result<String, String> {
    let conn = db.conn.lock().unwrap();

    let mut csv = String::from("experiment_id,date,title,batch_code,property_name,value,unit,test_method\n");

    let mut stmt = conn
        .prepare(
            "SELECT e.id, e.date, e.title, e.batch_code, pm.property_name, pm.value, pm.unit, pm.test_method
             FROM experiments e
             LEFT JOIN property_measurements pm ON e.id = pm.experiment_id
             WHERE e.project_id = ?1
             ORDER BY e.date, pm.property_name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<f64>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, Option<String>>(7)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for row in rows {
        let (id, date, title, batch, prop, val, unit, method) = row.map_err(|e| e.to_string())?;
        let escape_csv = |s: &str| {
            if s.contains(',') || s.contains('"') {
                format!("\"{}\"", s.replace('"', "\"\""))
            } else {
                s.to_string()
            }
        };
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            id, date, escape_csv(&title), escape_csv(&batch),
            prop.as_deref().unwrap_or(""),
            val.map(|v| v.to_string()).unwrap_or_default(),
            unit.as_deref().unwrap_or(""),
            method.as_deref().unwrap_or("")
        ));
    }

    Ok(csv)
}

#[tauri::command]
pub fn export_full_backup_json(db: State<AppDb>) -> Result<String, String> {
    let conn = db.conn.lock().unwrap();

    let query_json = |sql: &str| -> Result<Vec<serde_json::Value>, String> {
        let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
        let col_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
        let col_count = col_names.len();

        let rows = stmt
            .query_map([], |row| {
                let mut map = serde_json::Map::new();
                for i in 0..col_count {
                    let val: rusqlite::types::Value = row.get_unwrap(i);
                    let json_val = match val {
                        rusqlite::types::Value::Null => serde_json::Value::Null,
                        rusqlite::types::Value::Integer(n) => serde_json::json!(n),
                        rusqlite::types::Value::Real(f) => serde_json::json!(f),
                        rusqlite::types::Value::Text(s) => serde_json::json!(s),
                        rusqlite::types::Value::Blob(b) => serde_json::json!(base64_encode(&b)),
                    };
                    map.insert(col_names[i].clone(), json_val);
                }
                Ok(serde_json::Value::Object(map))
            })
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    };

    let backup = serde_json::json!({
        "version": "1.0",
        "exported_at": chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        "projects": query_json("SELECT * FROM projects")?,
        "tasks": query_json("SELECT * FROM tasks")?,
        "experiments": query_json("SELECT * FROM experiments")?,
        "formulation_entries": query_json("SELECT * FROM formulation_entries")?,
        "process_conditions": query_json("SELECT * FROM process_conditions")?,
        "property_measurements": query_json("SELECT * FROM property_measurements")?,
        "inventory_logs": query_json("SELECT * FROM inventory_logs")?,
    });

    serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())
}

fn base64_encode(data: &[u8]) -> String {
    // Simple base64 for blob fields (unlikely to be used in MVP)
    use std::fmt::Write;
    let mut s = String::new();
    for byte in data {
        write!(s, "{:02x}", byte).unwrap();
    }
    s
}
