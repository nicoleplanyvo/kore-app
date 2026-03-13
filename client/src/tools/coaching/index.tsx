import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SessionDetailPage } from './pages/SessionDetailPage';

export default function CoachingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="sessions/:id" element={<SessionDetailPage />} />
    </Routes>
  );
}
