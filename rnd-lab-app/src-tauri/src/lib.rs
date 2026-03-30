mod commands;
mod db;
mod models;

use commands::{experiment_cmds, export_cmds, inventory_cmds, project_cmds, task_cmds};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize database
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            let database = db::AppDb::new(app_dir).expect("failed to initialize database");

            // Seed sample data on first run
            db::seed_sample_data(&database).expect("failed to seed sample data");

            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Projects
            project_cmds::list_projects,
            project_cmds::get_project,
            project_cmds::create_project,
            project_cmds::update_project,
            project_cmds::delete_project,
            // Tasks
            task_cmds::list_tasks_by_date_range,
            task_cmds::list_tasks_by_project,
            task_cmds::create_task,
            task_cmds::update_task,
            task_cmds::delete_task,
            // Experiments
            experiment_cmds::list_experiments_by_project,
            experiment_cmds::get_experiment,
            experiment_cmds::create_experiment,
            experiment_cmds::update_experiment,
            experiment_cmds::list_recent_experiments,
            // Formulation
            experiment_cmds::list_formulation_entries,
            experiment_cmds::create_formulation_entry,
            experiment_cmds::delete_formulation_entry,
            // Process Conditions
            experiment_cmds::list_process_conditions,
            experiment_cmds::create_process_condition,
            experiment_cmds::delete_process_condition,
            // Property Measurements
            experiment_cmds::list_property_measurements,
            experiment_cmds::list_property_measurements_by_project,
            experiment_cmds::create_property_measurement,
            experiment_cmds::delete_property_measurement,
            // Inventory
            inventory_cmds::list_inventory_logs,
            inventory_cmds::list_recent_inventory_logs,
            inventory_cmds::create_inventory_log,
            inventory_cmds::update_inventory_test_result,
            inventory_cmds::delete_inventory_log,
            // Export
            export_cmds::generate_weekly_summary_md,
            export_cmds::export_project_experiments_csv,
            export_cmds::export_full_backup_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
