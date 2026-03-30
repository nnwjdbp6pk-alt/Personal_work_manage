import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ExperimentDetailPage from './pages/experiments/ExperimentDetailPage';
import InventoryLogPage from './pages/inventory/InventoryLogPage';
import TaskWeeklyPage from './pages/tasks/TaskWeeklyPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
        <Route path="/inventory" element={<InventoryLogPage />} />
        <Route path="/tasks" element={<TaskWeeklyPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
