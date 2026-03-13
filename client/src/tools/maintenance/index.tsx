import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { RequestListPage } from './pages/RequestListPage';
import { RequestDetailPage } from './pages/RequestDetailPage';

export default function MaintenanceTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="requests" element={<RequestListPage />} />
      <Route path="requests/:id" element={<RequestDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
