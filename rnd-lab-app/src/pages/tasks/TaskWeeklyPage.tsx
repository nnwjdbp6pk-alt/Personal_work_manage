import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTasksByDateRange, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { generateWeeklySummary, exportFullBackupJson, downloadAsFile } from '../../hooks/useExport';
import { today, getWeekRange } from '../../lib/date';
import type { CreateTask } from '../../types/models';

export default function TaskWeeklyPage() {
  const { start, end } = getWeekRange();
  const { data: tasks = [] } = useTasksByDateRange(start, end);
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showModal, setShowModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryMd, setSummaryMd] = useState('');

  const { register, handleSubmit, reset } = useForm<CreateTask>({
    defaultValues: {
      date: today(),
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      project_id: null,
    },
  });

  const onSubmit = (data: CreateTask) => {
    const payload = { ...data, project_id: data.project_id || null };
    createTask.mutate(payload, {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  };

  const toggleStatus = (task: typeof tasks[0]) => {
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    updateTask.mutate({
      id: task.id,
      data: { ...task, status: nextStatus, project_id: task.project_id ?? null },
    });
  };

  const handleGenerateSummary = async () => {
    const md = await generateWeeklySummary(start, end);
    setSummaryMd(md);
    setShowSummary(true);
  };

  const handleExportSummary = () => {
    downloadAsFile(summaryMd, `weekly_summary_${start}_${end}.md`);
  };

  const handleFullBackup = async () => {
    const json = await exportFullBackupJson();
    downloadAsFile(json, `rnd_lab_backup_${today()}.json`, 'application/json');
  };

  // Group tasks by date
  const tasksByDate = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});
  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <div>
      <PageHeader title={`업무 관리 (${start} ~ ${end})`}>
        <Button variant="secondary" size="sm" onClick={handleFullBackup}>JSON 백업</Button>
        <Button variant="secondary" size="sm" onClick={handleGenerateSummary}>주간 요약</Button>
        <Button onClick={() => setShowModal(true)}>+ 업무 추가</Button>
      </PageHeader>

      {sortedDates.length === 0 ? (
        <p className="text-sm text-gray-400">이번 주 업무가 없습니다.</p>
      ) : (
        sortedDates.map(date => (
          <div key={date} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">{date}</h3>
            <div className="space-y-1">
              {tasksByDate[date].map(t => (
                <div key={t.id} className="bg-white rounded border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStatus(t)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                        t.status === 'done'
                          ? 'bg-green-500 border-green-500 text-white'
                          : t.status === 'in_progress'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {t.status === 'done' ? '✓' : t.status === 'in_progress' ? '▶' : ''}
                    </button>
                    <div>
                      <span className={`text-sm ${t.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                        {t.title}
                      </span>
                      {t.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={t.priority} />
                    <button onClick={() => deleteTask.mutate(t.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create task modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="업무 추가">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <input {...register('title', { required: true })} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input type="date" {...register('date')} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">우선순위</label>
              <select {...register('priority')} className="w-full border rounded px-3 py-1.5 text-sm">
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea {...register('description')} rows={2} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">프로젝트 (선택)</label>
            <select {...register('project_id', { setValueAs: v => v ? Number(v) : null })} className="w-full border rounded px-3 py-1.5 text-sm">
              <option value="">없음</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
            <Button type="submit" disabled={createTask.isPending}>추가</Button>
          </div>
        </form>
      </Modal>

      {/* Weekly summary modal */}
      <Modal open={showSummary} onClose={() => setShowSummary(false)} title="주간 업무 요약">
        <div className="max-h-[60vh] overflow-auto">
          <pre className="text-sm whitespace-pre-wrap bg-gray-50 rounded p-4 font-mono">
            {summaryMd}
          </pre>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowSummary(false)}>닫기</Button>
          <Button onClick={handleExportSummary}>Markdown 다운로드</Button>
        </div>
      </Modal>
    </div>
  );
}
