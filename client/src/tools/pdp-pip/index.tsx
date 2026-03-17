import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function PdpPipRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="plans/:id" element={<PlanDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
