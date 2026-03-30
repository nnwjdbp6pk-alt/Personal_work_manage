import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '../lib/invoke';
import type {
  Experiment, CreateExperiment,
  FormulationEntry, CreateFormulationEntry,
  ProcessCondition, CreateProcessCondition,
  PropertyMeasurement, CreatePropertyMeasurement,
} from '../types/models';

export function useExperimentsByProject(projectId: number) {
  return useQuery({
    queryKey: ['experiments', 'project', projectId],
    queryFn: () => invoke<Experiment[]>('list_experiments_by_project', { projectId }),
    enabled: projectId > 0,
  });
}

export function useExperiment(id: number) {
  return useQuery({
    queryKey: ['experiments', id],
    queryFn: () => invoke<Experiment>('get_experiment', { id }),
    enabled: id > 0,
  });
}

export function useRecentExperiments(limit = 5) {
  return useQuery({
    queryKey: ['experiments', 'recent', limit],
    queryFn: () => invoke<Experiment[]>('list_recent_experiments', { limit }),
  });
}

export function useCreateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExperiment) => invoke<Experiment>('create_experiment', { data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experiments'] }),
  });
}

export function useUpdateExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateExperiment }) =>
      invoke<Experiment>('update_experiment', { id, data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experiments'] }),
  });
}

// Formulation entries
export function useFormulationEntries(experimentId: number) {
  return useQuery({
    queryKey: ['formulations', experimentId],
    queryFn: () => invoke<FormulationEntry[]>('list_formulation_entries', { experimentId }),
    enabled: experimentId > 0,
  });
}

export function useCreateFormulationEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFormulationEntry) =>
      invoke<FormulationEntry>('create_formulation_entry', { data }),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['formulations', vars.experiment_id] }),
  });
}

export function useDeleteFormulationEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_formulation_entry', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formulations'] }),
  });
}

// Process conditions
export function useProcessConditions(experimentId: number) {
  return useQuery({
    queryKey: ['processConditions', experimentId],
    queryFn: () => invoke<ProcessCondition[]>('list_process_conditions', { experimentId }),
    enabled: experimentId > 0,
  });
}

export function useCreateProcessCondition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProcessCondition) =>
      invoke<ProcessCondition>('create_process_condition', { data }),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['processConditions', vars.experiment_id] }),
  });
}

export function useDeleteProcessCondition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_process_condition', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processConditions'] }),
  });
}

// Property measurements
export function usePropertyMeasurements(experimentId: number) {
  return useQuery({
    queryKey: ['properties', experimentId],
    queryFn: () => invoke<PropertyMeasurement[]>('list_property_measurements', { experimentId }),
    enabled: experimentId > 0,
  });
}

export function usePropertyMeasurementsByProject(projectId: number) {
  return useQuery({
    queryKey: ['properties', 'project', projectId],
    queryFn: () =>
      invoke<PropertyMeasurement[]>('list_property_measurements_by_project', { projectId }),
    enabled: projectId > 0,
  });
}

export function useCreatePropertyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyMeasurement) =>
      invoke<PropertyMeasurement>('create_property_measurement', { data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
}

export function useDeletePropertyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoke<void>('delete_property_measurement', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
}
