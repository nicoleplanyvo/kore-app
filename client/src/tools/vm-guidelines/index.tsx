import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { GuidelineDetailPage } from './pages/GuidelineDetailPage';
import { ManagePage } from './pages/ManagePage';
import { DashboardPage } from './pages/DashboardPage';

export default function VmGuidelinesRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="guidelines/:id" element={<GuidelineDetailPage />} />
      <Route path="manage" element={<ManagePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
