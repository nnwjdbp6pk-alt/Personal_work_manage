import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/invoke';
import type { InventoryLog, CreateInventoryLog } from '../types/models';

interface InventoryFilter {
  start?: string;
  end?: string;
  itemName?: string;
  projectId?: number;
  subType?: string;
}

export function useInventoryLogs(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: ['inventory', filter],
    queryFn: () =>
      invoke<InventoryLog[]>('list_inventory_logs', {
        start: filter.start ?? null,
        end: filter.end ?? null,
        itemName: filter.itemName ?? null,
        projectId: filter.projectId ?? null,
        subType: filter.subType ?? null,
      }),
  });
}

export function useRecentInventoryLogs(limit = 5) {
  return useQuery({
    queryKey: ['inventory', 'recent', limit],
    queryFn: () => invoke<InventoryLog[]>('list_recent_inventory_logs', { limit }),
  });
}

export function useCreateInventoryLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryLog) =>
      invoke<InventoryLog>('create_inventory_log', { data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useUpdateTestResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; testResult: string }) =>
      invoke<InventoryLog>('update_inventory_test_result', {
        data: { id: data.id, test_result: data.testResult },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useDeleteInventoryLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_inventory_log', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}
