import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ZoneManagementPage } from './pages/ZoneManagementPage';
import { DashboardPage } from './pages/DashboardPage';

export default function LiveFloorTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="zones" element={<ZoneManagementPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
