import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/invoke';
import type { Project, CreateProject } from '../types/models';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => invoke<Project[]>('list_projects'),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => invoke<Project>('get_project', { id }),
    enabled: id > 0,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProject) => invoke<Project>('create_project', { data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProject }) =>
      invoke<Project>('update_project', { id, data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_project', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
