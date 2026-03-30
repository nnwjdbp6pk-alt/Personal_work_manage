import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTasksByDateRange } from '../../hooks/useTasks';
import { useRecentExperiments } from '../../hooks/useExperiments';
import { useRecentInventoryLogs } from '../../hooks/useInventory';
import { today, getWeekRange, formatDate } from '../../lib/date';

export default function DashboardPage() {
  const todayStr = today();
  const { start, end } = getWeekRange();

  const { data: todayTasks = [] } = useTasksByDateRange(todayStr, todayStr);
  const { data: weekTasks = [] } = useTasksByDateRange(start, end);
  const { data: recentExperiments = [] } = useRecentExperiments(5);
  const { data: recentLogs = [] } = useRecentInventoryLogs(5);

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const upcomingTasks = weekTasks.filter(t => t.date > todayStr && t.status !== 'done');

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-800 mb-3">오늘 업무 ({todayStr})</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 업무가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map(t => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.title}</span>
                  <StatusBadge value={t.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/tasks" className="text-xs text-blue-600 mt-3 inline-block hover:underline">
            업무 관리 &rarr;
          </Link>
        </section>

        {/* Upcoming tasks */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-800 mb-3">예정 업무</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-400">예정 업무가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.slice(0, 5).map(t => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-gray-400 mr-2">{t.date}</span>
                    {t.title}
                  </span>
                  <StatusBadge value={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent experiments */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-800 mb-3">최근 실험</h2>
          {recentExperiments.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 실험이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {recentExperiments.map(e => (
                <li key={e.id} className="text-sm">
                  <Link
                    to={`/experiments/${e.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <span className="text-gray-400 ml-2 text-xs">{e.batch_code} | {formatDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/projects" className="text-xs text-blue-600 mt-3 inline-block hover:underline">
            프로젝트 목록 &rarr;
          </Link>
        </section>

        {/* Recent inventory logs */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-800 mb-3">최근 입출고</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400">입출고 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {recentLogs.map(l => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span>
                    <StatusBadge value={l.log_type} />
                    <span className="ml-2">{l.item_name}</span>
                    <span className="text-gray-400 ml-1">{l.quantity}{l.unit}</span>
                    {l.sub_type && <span className="text-gray-300 ml-1 text-xs">({l.sub_type})</span>}
                  </span>
                  <span className="text-xs text-gray-400">{l.date}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/inventory" className="text-xs text-blue-600 mt-3 inline-block hover:underline">
            입출고 관리 &rarr;
          </Link>
        </section>
      </div>

      {/* Weekly summary link */}
      <div className="mt-6 text-center">
        <Link
          to="/tasks"
          className="text-sm text-blue-600 hover:underline"
        >
          이번 주 요약 보기 ({start} ~ {end}) &rarr;
        </Link>
      </div>
    </div>
  );
}
