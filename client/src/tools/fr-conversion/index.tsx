import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

export default function FrConversionRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
