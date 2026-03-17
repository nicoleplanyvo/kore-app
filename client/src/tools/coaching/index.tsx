import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { CreateSessionPage } from './pages/CreateSessionPage';
import { DashboardPage } from './pages/DashboardPage';

export default function CoachingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreateSessionPage />} />
      <Route path="sessions/:id" element={<SessionDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
