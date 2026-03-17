import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function MaintenanceTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="requests/:id" element={<RequestDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
