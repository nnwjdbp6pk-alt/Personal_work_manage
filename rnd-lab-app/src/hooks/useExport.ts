import { invoke } from '../lib/invoke';

export async function generateWeeklySummary(start: string, end: string): Promise<string> {
  return invoke<string>('generate_weekly_summary_md', { start, end });
}

export async function exportProjectCsv(projectId: number): Promise<string> {
  return invoke<string>('export_project_experiments_csv', { projectId });
}

export async function exportFullBackupJson(): Promise<string> {
  return invoke<string>('export_full_backup_json');
}

export function downloadAsFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
