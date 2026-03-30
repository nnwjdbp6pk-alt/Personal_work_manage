// Domain models matching SQLite schema

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Task {
  id: number;
  date: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Experiment {
  id: number;
  project_id: number;
  date: string;
  title: string;
  batch_code: string;
  objective: string;
  observation_md: string;
  result_summary: string;
}

export interface FormulationEntry {
  id: number;
  experiment_id: number;
  material_name: string;
  amount: number;
  unit: string;
  role: string;
}

export interface ProcessCondition {
  id: number;
  experiment_id: number;
  temperature: number | null;
  mixing_time: number | null;
  mixing_speed: number | null;
  ph: number | null;
  aging_time: number | null;
  memo: string;
}

export interface PropertyMeasurement {
  id: number;
  experiment_id: number;
  property_name: string;
  value: number;
  unit: string;
  test_method: string;
  memo: string;
}

export interface InventoryLog {
  id: number;
  item_name: string;
  log_type: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  date: string;
  purpose: string;
  project_id: number | null;
  experiment_id: number | null;
  memo: string;
}

// Form input types (without id, for creation)
export type CreateProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type CreateTask = Omit<Task, 'id'>;
export type CreateExperiment = Omit<Experiment, 'id'>;
export type CreateFormulationEntry = Omit<FormulationEntry, 'id'>;
export type CreateProcessCondition = Omit<ProcessCondition, 'id'>;
export type CreatePropertyMeasurement = Omit<PropertyMeasurement, 'id'>;
export type CreateInventoryLog = Omit<InventoryLog, 'id'>;
