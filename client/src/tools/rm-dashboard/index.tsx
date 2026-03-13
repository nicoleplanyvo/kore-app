import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AlertsPage } from './pages/AlertsPage';
import { TrendsPage } from './pages/TrendsPage';

export default function RmDashboardRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="trends" element={<TrendsPage />} />
    </Routes>
  );
}
