import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';

export default function NewsletterRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path=":id" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
