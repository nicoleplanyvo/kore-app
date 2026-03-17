import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { TaskListPage } from './pages/TaskListPage';
import { TaskCreatePage } from './pages/TaskCreatePage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { RankingPage } from './pages/RankingPage';

export default function MultiStoreRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="tasks" element={<TaskListPage />} />
      <Route path="tasks/create" element={<TaskCreatePage />} />
      <Route path="tasks/:id" element={<TaskDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="comparison" element={<ComparisonPage />} />
      <Route path="ranking" element={<RankingPage />} />
    </Routes>
  );
}
