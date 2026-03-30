import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  useInventoryLogs,
  useCreateInventoryLog,
  useDeleteInventoryLog,
  useUpdateTestResult,
} from '../../hooks/useInventory';
import { useProjects } from '../../hooks/useProjects';
import { today } from '../../lib/date';
import {
  INVENTORY_SUB_TYPES_IN,
  INVENTORY_SUB_TYPES_OUT,
} from '../../types/models';
import type { CreateInventoryLog, InventoryLog } from '../../types/models';

const ALL_SUB_TYPES = [...INVENTORY_SUB_TYPES_IN, ...INVENTORY_SUB_TYPES_OUT];

const emptyForm: CreateInventoryLog = {
  item_name: '',
  log_type: 'IN',
  sub_type: '원료 샘플(입고)',
  quantity: 0,
  unit: 'g',
  date: today(),
  purpose: '',
  project_id: null,
  experiment_id: null,
  memo: '',
  provider: '',
  usage_desc: '',
  unit_price: null,
  form_factor: null,
  total_amount: null,
  recipient_dept: '',
  recipient_name: '',
  lot: '',
  test_content: '',
  test_result: '',
};

export default function InventoryLogPage() {
  const [filter, setFilter] = useState({
    itemName: '',
    projectId: undefined as number | undefined,
    subType: undefined as string | undefined,
  });
  const { data: logs = [], isLoading } = useInventoryLogs({
    itemName: filter.itemName || undefined,
    projectId: filter.projectId,
    subType: filter.subType,
  });
  const { data: projects = [] } = useProjects();
  const createLog = useCreateInventoryLog();
  const deleteLog = useDeleteInventoryLog();
  const updateTestResult = useUpdateTestResult();
  const [showModal, setShowModal] = useState(false);
  const [editingTestResult, setEditingTestResult] = useState<{ id: number; value: string } | null>(null);

  const { register, handleSubmit, reset, control, setValue } = useForm<CreateInventoryLog>({
    defaultValues: emptyForm,
  });

  const watchLogType = useWatch({ control, name: 'log_type' });
  const watchSubType = useWatch({ control, name: 'sub_type' });
  const watchQty = useWatch({ control, name: 'quantity' });
  const watchUnitPrice = useWatch({ control, name: 'unit_price' });
  const watchFormFactor = useWatch({ control, name: 'form_factor' });

  // 자사 샘플: total_amount 자동 계산
  const computedTotal =
    watchSubType === '자사 샘플(입고)' && watchQty && watchUnitPrice && watchFormFactor
      ? watchQty * watchUnitPrice * watchFormFactor
      : null;

  const onSubmit = (data: CreateInventoryLog) => {
    const payload: CreateInventoryLog = {
      ...data,
      project_id: data.project_id || null,
      experiment_id: data.experiment_id || null,
      total_amount: data.sub_type === '자사 샘플(입고)' ? computedTotal : null,
    };
    createLog.mutate(payload, {
      onSuccess: () => {
        setShowModal(false);
        reset(emptyForm);
      },
    });
  };

  const handleLogTypeChange = (logType: 'IN' | 'OUT') => {
    setValue('log_type', logType);
    const defaultSubType = logType === 'IN' ? '원료 샘플(입고)' : '견본(출고)';
    setValue('sub_type', defaultSubType);
  };

  const subTypeOptions = watchLogType === 'IN' ? INVENTORY_SUB_TYPES_IN : INVENTORY_SUB_TYPES_OUT;

  // 유형별 추가 필드 표시 조건
  const show원료 = watchSubType === '원료 샘플(입고)';
  const show자사 = watchSubType === '자사 샘플(입고)';
  const show견본 = watchSubType === '견본(출고)';
  const show시험 = watchSubType === '시험 샘플(출고)';

  // sub_type별 추가 컬럼 라벨 생성
  const getExtraInfo = (l: InventoryLog): string => {
    switch (l.sub_type) {
      case '원료 샘플(입고)':
        return [l.provider && `제공: ${l.provider}`, l.usage_desc && `용도: ${l.usage_desc}`]
          .filter(Boolean).join(' | ');
      case '자사 샘플(입고)':
        return l.total_amount != null ? `총액: ${l.total_amount.toLocaleString()}원` : '';
      case '견본(출고)':
        return [l.recipient_dept, l.recipient_name].filter(Boolean).join(' / ');
      case '시험 샘플(출고)':
        return [l.lot && `LOT: ${l.lot}`, l.test_content].filter(Boolean).join(' | ');
      default:
        return '';
    }
  };

  return (
    <div>
      <PageHeader title="입출고 기록">
        <Button onClick={() => setShowModal(true)}>+ 기록 추가</Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="품목명 검색..."
          value={filter.itemName}
          onChange={e => setFilter(f => ({ ...f, itemName: e.target.value }))}
          className="border rounded px-3 py-1.5 text-sm w-52"
        />
        <select
          value={filter.subType ?? ''}
          onChange={e => setFilter(f => ({ ...f, subType: e.target.value || undefined }))}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">전체 유형</option>
          <optgroup label="입고">
            {INVENTORY_SUB_TYPES_IN.map(s => <option key={s} value={s}>{s}</option>)}
          </optgroup>
          <optgroup label="출고">
            {INVENTORY_SUB_TYPES_OUT.map(s => <option key={s} value={s}>{s}</option>)}
          </optgroup>
        </select>
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
              <th className="border px-3 py-2">유형</th>
              <th className="border px-3 py-2 text-left">품목명</th>
              <th className="border px-3 py-2 text-right">수량</th>
              <th className="border px-3 py-2 text-left">상세 정보</th>
              <th className="border px-3 py-2 text-left">메모</th>
              <th className="border px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="border px-3 py-1.5">{l.date}</td>
                <td className="border px-3 py-1.5 text-center"><StatusBadge value={l.log_type} /></td>
                <td className="border px-3 py-1.5 text-center text-xs">{l.sub_type}</td>
                <td className="border px-3 py-1.5">{l.item_name}</td>
                <td className="border px-3 py-1.5 text-right">{l.quantity} {l.unit}</td>
                <td className="border px-3 py-1.5 text-xs text-gray-500">
                  {getExtraInfo(l)}
                  {l.sub_type === '시험 샘플(출고)' && (
                    <div className="mt-1">
                      <span className="text-gray-400">결과: </span>
                      {editingTestResult?.id === l.id ? (
                        <span className="inline-flex gap-1 items-center">
                          <input
                            className="border rounded px-1.5 py-0.5 text-xs w-40"
                            value={editingTestResult.value}
                            onChange={e => setEditingTestResult({ id: l.id, value: e.target.value })}
                          />
                          <button
                            onClick={() => {
                              updateTestResult.mutate({ id: l.id, testResult: editingTestResult.value });
                              setEditingTestResult(null);
                            }}
                            className="text-blue-600 text-xs"
                          >
                            저장
                          </button>
                          <button onClick={() => setEditingTestResult(null)} className="text-gray-400 text-xs">취소</button>
                        </span>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => setEditingTestResult({ id: l.id, value: l.test_result })}
                          title="클릭하여 수정"
                        >
                          {l.test_result || '(미입력 - 클릭하여 입력)'}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="border px-3 py-1.5 text-gray-400 text-xs">{l.memo}</td>
                <td className="border px-3 py-1.5 text-center">
                  <button onClick={() => deleteLog.mutate(l.id)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={8} className="border px-3 py-4 text-center text-gray-400">기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="입출고 기록 추가">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* 구분 + 유형 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">구분</label>
              <select
                {...register('log_type')}
                onChange={e => handleLogTypeChange(e.target.value as 'IN' | 'OUT')}
                className="w-full border rounded px-3 py-1.5 text-sm"
              >
                <option value="IN">입고</option>
                <option value="OUT">출고</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">유형</label>
              <select {...register('sub_type')} className="w-full border rounded px-3 py-1.5 text-sm">
                {subTypeOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 공통 필드 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">품목명</label>
              <input {...register('item_name', { required: true })} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input type="date" {...register('date')} className="w-full border rounded px-3 py-1.5 text-sm" />
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
              <label className="block text-sm font-medium mb-1">목적</label>
              <input {...register('purpose')} className="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>

          {/* 원료 샘플(입고) 전용 */}
          {show원료 && (
            <div className="grid grid-cols-2 gap-3 bg-green-50 rounded p-3">
              <div>
                <label className="block text-sm font-medium mb-1">제공자</label>
                <input {...register('provider')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: ABC Chemical" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">용도</label>
                <input {...register('usage_desc')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: UV 접착제 배합용" />
              </div>
            </div>
          )}

          {/* 자사 샘플(입고) 전용 */}
          {show자사 && (
            <div className="bg-blue-50 rounded p-3 space-y-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">단가 (원)</label>
                  <input {...register('unit_price', { valueAsNumber: true })} type="number" step="any" className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">규격 계수</label>
                  <input {...register('form_factor', { valueAsNumber: true })} type="number" step="any" className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: 1.0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">총액 (자동)</label>
                  <div className="border rounded px-3 py-1.5 text-sm bg-gray-100 text-gray-600">
                    {computedTotal != null ? `${computedTotal.toLocaleString()} 원` : '-'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">총액 = 수량 × 단가 × 규격 계수</p>
            </div>
          )}

          {/* 견본(출고) 전용 */}
          {show견본 && (
            <div className="grid grid-cols-2 gap-3 bg-orange-50 rounded p-3">
              <div>
                <label className="block text-sm font-medium mb-1">수신 부서</label>
                <input {...register('recipient_dept')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: 품질관리팀" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">수신자</label>
                <input {...register('recipient_name')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: 김철수" />
              </div>
            </div>
          )}

          {/* 시험 샘플(출고) 전용 */}
          {show시험 && (
            <div className="bg-purple-50 rounded p-3 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">LOT 번호</label>
                  <input {...register('lot')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: UV-A3-0327" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">시험 내용</label>
                  <input {...register('test_content')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="예: 점도/접착강도 측정" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">시험 결과 (나중에 수정 가능)</label>
                <input {...register('test_result')} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="입력하지 않아도 됩니다" />
              </div>
            </div>
          )}

          {/* 프로젝트 / 메모 */}
          <div className="grid grid-cols-2 gap-3">
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
