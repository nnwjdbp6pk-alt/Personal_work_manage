import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/invoke';
import type { Task, CreateTask } from '../types/models';

export function useTasksByDateRange(start: string, end: string) {
  return useQuery({
    queryKey: ['tasks', 'range', start, end],
    queryFn: () => invoke<Task[]>('list_tasks_by_date_range', { start, end }),
    enabled: !!start && !!end,
  });
}

export function useTasksByProject(projectId: number) {
  return useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: () => invoke<Task[]>('list_tasks_by_project', { projectId }),
    enabled: projectId > 0,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTask) => invoke<Task>('create_task', { data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTask }) =>
      invoke<Task>('update_task', { id, data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_task', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
