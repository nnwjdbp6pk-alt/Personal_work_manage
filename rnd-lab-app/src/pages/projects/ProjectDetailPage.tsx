import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useProject, useUpdateProject } from '../../hooks/useProjects';
import { useExperimentsByProject, useCreateExperiment, usePropertyMeasurementsByProject } from '../../hooks/useExperiments';
import { useTasksByProject } from '../../hooks/useTasks';
import { useInventoryLogs } from '../../hooks/useInventory';
import { exportProjectCsv, downloadAsFile } from '../../hooks/useExport';
import { today, formatDate } from '../../lib/date';
import type { CreateExperiment, Experiment } from '../../types/models';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();

  const { data: project } = useProject(projectId);
  const { data: experiments = [] } = useExperimentsByProject(projectId);
  const { data: tasks = [] } = useTasksByProject(projectId);
  const { data: inventoryLogs = [] } = useInventoryLogs({ projectId });
  const { data: allProperties = [] } = usePropertyMeasurementsByProject(projectId);
  const updateProject = useUpdateProject();
  const createExperiment = useCreateExperiment();

  const [showExpModal, setShowExpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'experiments' | 'properties' | 'tasks' | 'inventory'>('experiments');

  const { register, handleSubmit, reset } = useForm<CreateExperiment>({
    defaultValues: {
      project_id: projectId,
      date: today(),
      title: '',
      batch_code: '',
      objective: '',
      observation_md: '',
      result_summary: '',
    },
  });

  const onCreateExperiment = (data: CreateExperiment) => {
    createExperiment.mutate({ ...data, project_id: projectId }, {
      onSuccess: () => {
        setShowExpModal(false);
        reset();
      },
    });
  };

  const handleExportCsv = async () => {
    const csv = await exportProjectCsv(projectId);
    downloadAsFile(csv, `${project?.name ?? 'project'}_experiments.csv`, 'text/csv');
  };

  // Build property comparison table
  const propertyNames = [...new Set(allProperties.map(p => p.property_name))];
  const expMap = new Map<number, Experiment>();
  experiments.forEach(e => expMap.set(e.id, e));

  if (!project) return <p className="text-gray-400 text-sm">로딩 중...</p>;

  const tabs = [
    { key: 'experiments' as const, label: '실험 목록' },
    { key: 'properties' as const, label: '물성 비교표' },
    { key: 'tasks' as const, label: '관련 업무' },
    { key: 'inventory' as const, label: '입출고 기록' },
  ];

  return (
    <div>
      <PageHeader title={project.name}>
        <Button variant="secondary" size="sm" onClick={handleExportCsv}>CSV Export</Button>
        <Button size="sm" onClick={() => setShowExpModal(true)}>+ 실험 추가</Button>
      </PageHeader>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <p className="text-sm text-gray-600">{project.description}</p>
        <div className="mt-2 flex gap-4 text-xs text-gray-400">
          <StatusBadge value={project.status} />
          <span>생성: {formatDate(project.created_at)}</span>
          <span>수정: {formatDate(project.updated_at)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'experiments' && (
        <div className="space-y-2">
          {experiments.length === 0 ? (
            <p className="text-sm text-gray-400">실험이 없습니다.</p>
          ) : (
            experiments.map(e => (
              <Link
                key={e.id}
                to={`/experiments/${e.id}`}
                className="block bg-white rounded border p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{e.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{e.batch_code}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                </div>
                {e.result_summary && (
                  <p className="text-xs text-gray-500 mt-1">{e.result_summary}</p>
                )}
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="overflow-auto">
          {propertyNames.length === 0 ? (
            <p className="text-sm text-gray-400">물성 데이터가 없습니다.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">물성</th>
                  {experiments.map(e => (
                    <th key={e.id} className="border px-3 py-2 text-center">
                      <Link to={`/experiments/${e.id}`} className="text-blue-600 hover:underline">
                        {e.batch_code || e.title}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propertyNames.map(pName => (
                  <tr key={pName}>
                    <td className="border px-3 py-1.5 font-medium">{pName}</td>
                    {experiments.map(e => {
                      const pm = allProperties.find(
                        p => p.experiment_id === e.id && p.property_name === pName
                      );
                      return (
                        <td key={e.id} className="border px-3 py-1.5 text-center">
                          {pm ? `${pm.value} ${pm.unit}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400">관련 업무가 없습니다.</p>
          ) : (
            tasks.map(t => (
              <div key={t.id} className="bg-white rounded border p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm">{t.title}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.date}</span>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={t.priority} />
                  <StatusBadge value={t.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-2">
          {inventoryLogs.length === 0 ? (
            <p className="text-sm text-gray-400">입출고 기록이 없습니다.</p>
          ) : (
            inventoryLogs.map(l => (
              <div key={l.id} className="bg-white rounded border p-3 flex justify-between items-center text-sm">
                <div>
                  <StatusBadge value={l.log_type} />
                  <span className="ml-2">{l.item_name}</span>
                  <span className="text-gray-400 ml-1">{l.quantity}{l.unit}</span>
                </div>
                <span className="text-xs text-gray-400">{l.date}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create experiment modal */}
      <Modal open={showExpModal} onClose={() => setShowExpModal(false)} title="새 실험">
        <form onSubmit={handleSubmit(onCreateExperiment)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input {...register('title', { required: true })} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">배치 코드</label>
              <input {...register('batch_code')} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">날짜</label>
            <input type="date" {...register('date')} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">목적</label>
            <textarea {...register('objective')} rows={2} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowExpModal(false)}>취소</Button>
            <Button type="submit" disabled={createExperiment.isPending}>생성</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
