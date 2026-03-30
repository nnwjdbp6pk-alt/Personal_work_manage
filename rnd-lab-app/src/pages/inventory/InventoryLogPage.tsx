import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useInventoryLogs, useCreateInventoryLog, useDeleteInventoryLog } from '../../hooks/useInventory';
import { useProjects } from '../../hooks/useProjects';
import { today } from '../../lib/date';
import type { CreateInventoryLog } from '../../types/models';

export default function InventoryLogPage() {
  const [filter, setFilter] = useState({ itemName: '', projectId: undefined as number | undefined });
  const { data: logs = [], isLoading } = useInventoryLogs({
    itemName: filter.itemName || undefined,
    projectId: filter.projectId,
  });
  const { data: projects = [] } = useProjects();
  const createLog = useCreateInventoryLog();
  const deleteLog = useDeleteInventoryLog();
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset } = useForm<CreateInventoryLog>({
    defaultValues: {
      item_name: '',
      log_type: 'IN',
      quantity: 0,
      unit: 'g',
      date: today(),
      purpose: '',
      project_id: null,
      experiment_id: null,
      memo: '',
    },
  });

  const onSubmit = (data: CreateInventoryLog) => {
    const payload = {
      ...data,
      project_id: data.project_id || null,
      experiment_id: data.experiment_id || null,
    };
    createLog.mutate(payload, {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  };

  return (
    <div>
      <PageHeader title="입출고 기록">
        <Button onClick={() => setShowModal(true)}>+ 기록 추가</Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="품목명 검색..."
          value={filter.itemName}
          onChange={e => setFilter(f => ({ ...f, itemName: e.target.value }))}
          className="border rounded px-3 py-1.5 text-sm w-60"
        />
        <select
          value={filter.projectId ?? ''}
          onChange={e => setFilter(f => ({ ...f, projectId: e.target.value ? Number(e.target.value) : undefined }))}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">전체 프로젝트</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-400">로딩 중...</p>
      ) : (
        <table className="w-full text-sm border-collapse bg-white rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-2 text-left">날짜</th>
              <th className="border px-3 py-2">구분</th>
              <th className="border px-3 py-2 text-left">품목명</th>
              <th className="border px-3 py-2 text-right">수량</th>
              <th className="border px-3 py-2 text-left">목적</th>
              <th className="border px-3 py-2 text-left">메모</th>
              <th className="border px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="border px-3 py-1.5">{l.date}</td>
                <td className="border px-3 py-1.5 text-center"><StatusBadge value={l.log_type} /></td>
                <td className="border px-3 py-1.5">{l.item_name}</td>
                <td className="border px-3 py-1.5 text-right">{l.quantity} {l.unit}</td>
                <td className="border px-3 py-1.5">{l.purpose}</td>
                <td className="border px-3 py-1.5 text-gray-400">{l.memo}</td>
                <td className="border px-3 py-1.5 text-center">
                  <button onClick={() => deleteLog.mutate(l.id)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} className="border px-3 py-4 text-center text-gray-400">기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="입출고 기록 추가">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">품목명</label>
              <input {...register('item_name', { required: true })} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">구분</label>
              <select {...register('log_type')} className="w-full border rounded px-3 py-1.5 text-sm">
                <option value="IN">입고</option>
                <option value="OUT">출고</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">수량</label>
              <input {...register('quantity', { valueAsNumber: true })} type="number" step="any" className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">단위</label>
              <input {...register('unit')} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input type="date" {...register('date')} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">목적</label>
            <input {...register('purpose')} className="w-full border rounded px-3 py-1.5 text-sm" />
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
          <div>
            <label className="block text-sm font-medium mb-1">메모</label>
            <input {...register('memo')} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
            <Button type="submit" disabled={createLog.isPending}>저장</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
