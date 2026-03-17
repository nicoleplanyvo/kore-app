import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CreatePage } from './pages/CreatePage';
import { DetailPage } from './pages/DetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function HandoverRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreatePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path=":id" element={<DetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
