import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function TrackTraceRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="detail/:id" element={<OrderDetailPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
