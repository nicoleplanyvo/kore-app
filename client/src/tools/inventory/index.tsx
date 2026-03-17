import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CountPage } from './pages/CountPage';
import { DashboardPage } from './pages/DashboardPage';

export default function InventoryRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="count/:id" element={<CountPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
