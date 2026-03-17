import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ReportPage } from './pages/ReportPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function LossPreventionRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="report" element={<ReportPage />} />
      <Route path="incident/:id" element={<IncidentDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
