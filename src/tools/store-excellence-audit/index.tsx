import { Routes, Route } from 'react-router-dom';
import { SEAOverviewPage } from './pages/OverviewPage';
import { SEASessionListPage } from './pages/SessionListPage';
import { SEANewSessionPage } from './pages/NewSessionPage';
import { SEAConductPage } from './pages/ConductPage';
import { SEASessionDetailPage } from './pages/SessionDetailPage';

export function StoreExcellenceAuditRoutes() {
  return (
    <Routes>
      <Route index element={<SEAOverviewPage />} />
      <Route path="sessions" element={<SEASessionListPage />} />
      <Route path="sessions/new" element={<SEANewSessionPage />} />
      <Route path="sessions/:id" element={<SEASessionDetailPage />} />
      <Route path="sessions/:id/conduct" element={<SEAConductPage />} />
    </Routes>
  );
}
