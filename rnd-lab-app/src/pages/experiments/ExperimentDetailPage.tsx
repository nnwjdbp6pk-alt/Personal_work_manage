import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import {
  useExperiment,
  useUpdateExperiment,
  useFormulationEntries,
  useCreateFormulationEntry,
  useDeleteFormulationEntry,
  useProcessConditions,
  useCreateProcessCondition,
  useDeleteProcessCondition,
  usePropertyMeasurements,
  useCreatePropertyMeasurement,
  useDeletePropertyMeasurement,
} from '../../hooks/useExperiments';
import type {
  CreateFormulationEntry,
  CreateProcessCondition,
  CreatePropertyMeasurement,
  CreateExperiment,
} from '../../types/models';
import { formatDate } from '../../lib/date';
import { useState } from 'react';

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const experimentId = Number(id);

  const { data: experiment } = useExperiment(experimentId);
  const updateExperiment = useUpdateExperiment();
  const { data: formulations = [] } = useFormulationEntries(experimentId);
  const { data: conditions = [] } = useProcessConditions(experimentId);
  const { data: properties = [] } = usePropertyMeasurements(experimentId);

  const createFormulation = useCreateFormulationEntry();
  const deleteFormulation = useDeleteFormulationEntry();
  const createCondition = useCreateProcessCondition();
  const deleteCondition = useDeleteProcessCondition();
  const createProperty = useCreatePropertyMeasurement();
  const deleteProperty = useDeletePropertyMeasurement();

  const [editingNotes, setEditingNotes] = useState(false);
  const [observationMd, setObservationMd] = useState('');
  const [resultSummary, setResultSummary] = useState('');

  // Formulation form
  const formulationForm = useForm<CreateFormulationEntry>({
    defaultValues: { experiment_id: experimentId, material_name: '', amount: 0, unit: 'g', role: '' },
  });

  // Condition form
  const conditionForm = useForm<CreateProcessCondition>({
    defaultValues: { experiment_id: experimentId, temperature: null, mixing_time: null, mixing_speed: null, ph: null, aging_time: null, memo: '' },
  });

  // Property form
  const propertyForm = useForm<CreatePropertyMeasurement>({
    defaultValues: { experiment_id: experimentId, property_name: '', value: 0, unit: '', test_method: '', memo: '' },
  });

  if (!experiment) return <p className="text-sm text-gray-400">로딩 중...</p>;

  const startEditNotes = () => {
    setObservationMd(experiment.observation_md);
    setResultSummary(experiment.result_summary);
    setEditingNotes(true);
  };

  const saveNotes = () => {
    updateExperiment.mutate({
      id: experimentId,
      data: {
        project_id: experiment.project_id,
        date: experiment.date,
        title: experiment.title,
        batch_code: experiment.batch_code,
        objective: experiment.objective,
        observation_md: observationMd,
        result_summary: resultSummary,
      },
    });
    setEditingNotes(false);
  };

  const totalAmount = formulations.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-4xl">
      <PageHeader title={experiment.title}>
        <Button variant="secondary" size="sm" onClick={() => window.history.back()}>
          &larr; 뒤로
        </Button>
      </PageHeader>

      {/* Basic info */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-400">배치 코드:</span> <span className="font-medium">{experiment.batch_code}</span></div>
          <div><span className="text-gray-400">날짜:</span> {formatDate(experiment.date)}</div>
          <div className="col-span-2"><span className="text-gray-400">목적:</span> {experiment.objective}</div>
        </div>
      </section>

      {/* Formulation table */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-semibold mb-3">배합비</h3>
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-1.5 text-left">원료명</th>
              <th className="border px-3 py-1.5 text-right">함량</th>
              <th className="border px-3 py-1.5">단위</th>
              <th className="border px-3 py-1.5 text-right">비율(%)</th>
              <th className="border px-3 py-1.5">역할</th>
              <th className="border px-3 py-1.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {formulations.map(f => (
              <tr key={f.id}>
                <td className="border px-3 py-1.5">{f.material_name}</td>
                <td className="border px-3 py-1.5 text-right">{f.amount}</td>
                <td className="border px-3 py-1.5 text-center">{f.unit}</td>
                <td className="border px-3 py-1.5 text-right">
                  {totalAmount > 0 ? ((f.amount / totalAmount) * 100).toFixed(1) : '-'}
                </td>
                <td className="border px-3 py-1.5">{f.role}</td>
                <td className="border px-3 py-1.5 text-center">
                  <button onClick={() => deleteFormulation.mutate(f.id)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                </td>
              </tr>
            ))}
            {totalAmount > 0 && (
              <tr className="bg-gray-50 font-medium">
                <td className="border px-3 py-1.5">합계</td>
                <td className="border px-3 py-1.5 text-right">{totalAmount}</td>
                <td className="border px-3 py-1.5 text-center">{formulations[0]?.unit}</td>
                <td className="border px-3 py-1.5 text-right">100.0</td>
                <td className="border px-3 py-1.5" colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
        <form
          onSubmit={formulationForm.handleSubmit(data => {
            createFormulation.mutate({ ...data, experiment_id: experimentId });
            formulationForm.reset({ experiment_id: experimentId, material_name: '', amount: 0, unit: 'g', role: '' });
          })}
          className="flex gap-2 items-end"
        >
          <input {...formulationForm.register('material_name', { required: true })} placeholder="원료명" className="border rounded px-2 py-1 text-sm flex-1" />
          <input {...formulationForm.register('amount', { valueAsNumber: true })} type="number" step="any" placeholder="함량" className="border rounded px-2 py-1 text-sm w-20" />
          <input {...formulationForm.register('unit')} placeholder="단위" className="border rounded px-2 py-1 text-sm w-16" />
          <input {...formulationForm.register('role')} placeholder="역할" className="border rounded px-2 py-1 text-sm w-28" />
          <Button type="submit" size="sm">추가</Button>
        </form>
      </section>

      {/* Process conditions */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-semibold mb-3">공정 조건</h3>
        {conditions.map(c => (
          <div key={c.id} className="flex gap-4 text-sm mb-2 items-center">
            {c.temperature != null && <span>온도: {c.temperature}°C</span>}
            {c.mixing_time != null && <span>교반시간: {c.mixing_time}min</span>}
            {c.mixing_speed != null && <span>교반속도: {c.mixing_speed}rpm</span>}
            {c.ph != null && <span>pH: {c.ph}</span>}
            {c.aging_time != null && <span>숙성: {c.aging_time}min</span>}
            {c.memo && <span className="text-gray-400">({c.memo})</span>}
            <button onClick={() => deleteCondition.mutate(c.id)} className="text-red-400 hover:text-red-600 text-xs ml-auto">삭제</button>
          </div>
        ))}
        <form
          onSubmit={conditionForm.handleSubmit(data => {
            createCondition.mutate({ ...data, experiment_id: experimentId });
            conditionForm.reset({ experiment_id: experimentId, temperature: null, mixing_time: null, mixing_speed: null, ph: null, aging_time: null, memo: '' });
          })}
          className="flex gap-2 items-end flex-wrap mt-2"
        >
          <input {...conditionForm.register('temperature', { valueAsNumber: true })} type="number" step="any" placeholder="온도(°C)" className="border rounded px-2 py-1 text-sm w-24" />
          <input {...conditionForm.register('mixing_time', { valueAsNumber: true })} type="number" step="any" placeholder="교반(min)" className="border rounded px-2 py-1 text-sm w-24" />
          <input {...conditionForm.register('mixing_speed', { valueAsNumber: true })} type="number" step="any" placeholder="속도(rpm)" className="border rounded px-2 py-1 text-sm w-24" />
          <input {...conditionForm.register('ph', { valueAsNumber: true })} type="number" step="any" placeholder="pH" className="border rounded px-2 py-1 text-sm w-20" />
          <input {...conditionForm.register('aging_time', { valueAsNumber: true })} type="number" step="any" placeholder="숙성(min)" className="border rounded px-2 py-1 text-sm w-24" />
          <input {...conditionForm.register('memo')} placeholder="메모" className="border rounded px-2 py-1 text-sm flex-1" />
          <Button type="submit" size="sm">추가</Button>
        </form>
      </section>

      {/* Observation / Result notes (Markdown) */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">관찰 메모 / 결과 요약</h3>
          {editingNotes ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditingNotes(false)}>취소</Button>
              <Button size="sm" onClick={saveNotes}>저장</Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={startEditNotes}>편집</Button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">관찰 메모 (Markdown)</label>
              <textarea
                value={observationMd}
                onChange={e => setObservationMd(e.target.value)}
                rows={8}
                className="w-full border rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">결과 요약</label>
              <textarea
                value={resultSummary}
                onChange={e => setResultSummary(e.target.value)}
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm whitespace-pre-wrap bg-gray-50 rounded p-3 mb-2">
              {experiment.observation_md || '(관찰 메모 없음)'}
            </div>
            {experiment.result_summary && (
              <div className="text-sm">
                <span className="text-gray-400">결과:</span> {experiment.result_summary}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Property measurements */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-semibold mb-3">물성치</h3>
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-1.5 text-left">물성명</th>
              <th className="border px-3 py-1.5 text-right">값</th>
              <th className="border px-3 py-1.5">단위</th>
              <th className="border px-3 py-1.5">측정법</th>
              <th className="border px-3 py-1.5">메모</th>
              <th className="border px-3 py-1.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id}>
                <td className="border px-3 py-1.5">{p.property_name}</td>
                <td className="border px-3 py-1.5 text-right">{p.value}</td>
                <td className="border px-3 py-1.5 text-center">{p.unit}</td>
                <td className="border px-3 py-1.5">{p.test_method}</td>
                <td className="border px-3 py-1.5 text-gray-400">{p.memo}</td>
                <td className="border px-3 py-1.5 text-center">
                  <button onClick={() => deleteProperty.mutate(p.id)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr><td colSpan={6} className="border px-3 py-3 text-center text-gray-400">물성 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
        <form
          onSubmit={propertyForm.handleSubmit(data => {
            createProperty.mutate({ ...data, experiment_id: experimentId });
            propertyForm.reset({ experiment_id: experimentId, property_name: '', value: 0, unit: '', test_method: '', memo: '' });
          })}
          className="flex gap-2 items-end flex-wrap"
        >
          <input {...propertyForm.register('property_name', { required: true })} placeholder="물성명" className="border rounded px-2 py-1 text-sm flex-1" />
          <input {...propertyForm.register('value', { valueAsNumber: true })} type="number" step="any" placeholder="값" className="border rounded px-2 py-1 text-sm w-20" />
          <input {...propertyForm.register('unit')} placeholder="단위" className="border rounded px-2 py-1 text-sm w-16" />
          <input {...propertyForm.register('test_method')} placeholder="측정법" className="border rounded px-2 py-1 text-sm w-28" />
          <input {...propertyForm.register('memo')} placeholder="메모" className="border rounded px-2 py-1 text-sm w-28" />
          <Button type="submit" size="sm">추가</Button>
        </form>
      </section>
    </div>
  );
}
