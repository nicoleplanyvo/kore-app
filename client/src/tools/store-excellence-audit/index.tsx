import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SessionListPage } from './pages/SessionListPage';
import { NewSessionPage } from './pages/NewSessionPage';
import { ConductPage } from './pages/ConductPage';
import { SessionDetailPage } from './pages/SessionDetailPage';

export function StoreExcellenceAuditRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="sessions" element={<SessionListPage />} />
      <Route path="sessions/new" element={<NewSessionPage />} />
      <Route path="sessions/:id" element={<SessionDetailPage />} />
      <Route path="sessions/:id/conduct" element={<ConductPage />} />
    </Routes>
  );
}
