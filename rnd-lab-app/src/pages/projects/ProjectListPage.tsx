import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useProjects, useCreateProject, useDeleteProject } from '../../hooks/useProjects';
import { formatDate } from '../../lib/date';
import type { CreateProject } from '../../types/models';

export default function ProjectListPage() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset } = useForm<CreateProject>({
    defaultValues: { name: '', description: '', status: 'active' },
  });

  const onSubmit = (data: CreateProject) => {
    createProject.mutate(data, {
      onSuccess: () => {
        setShowModal(false);
        reset();
      },
    });
  };

  return (
    <div>
      <PageHeader title="Projects">
        <Button onClick={() => setShowModal(true)}>+ 새 프로젝트</Button>
      </PageHeader>

      {isLoading ? (
        <p className="text-gray-400 text-sm">로딩 중...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400 text-sm">프로젝트가 없습니다. 새 프로젝트를 생성해주세요.</p>
      ) : (
        <div className="grid gap-3">
          {projects.map(p => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={p.status} />
                  <span className="text-xs text-gray-400">{formatDate(p.updated_at)}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm('프로젝트를 삭제하시겠습니까?')) {
                        deleteProject.mutate(p.id);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="새 프로젝트">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input {...register('name', { required: true })} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea {...register('description')} rows={3} className="w-full border rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">상태</label>
            <select {...register('status')} className="border rounded px-3 py-1.5 text-sm">
              <option value="active">진행중</option>
              <option value="paused">일시중지</option>
              <option value="completed">완료</option>
              <option value="archived">보관</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
            <Button type="submit" disabled={createProject.isPending}>생성</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
