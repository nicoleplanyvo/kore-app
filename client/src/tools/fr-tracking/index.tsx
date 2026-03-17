import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { StaffPage } from './pages/StaffPage';
import { DashboardPage } from './pages/DashboardPage';

export default function FrTrackingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="analysis" element={<AnalysisPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
