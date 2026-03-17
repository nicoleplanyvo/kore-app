import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CheckInPage } from './pages/CheckInPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { TrendsPage } from './pages/TrendsPage';
import { DashboardPage } from './pages/DashboardPage';

export default function WellbeingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="checkin" element={<CheckInPage />} />
      <Route path="resources" element={<ResourceListPage />} />
      <Route path="trends" element={<TrendsPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
