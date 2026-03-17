import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { MessageDetailPage } from './pages/MessageDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function TeamPushRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="messages/:id" element={<MessageDetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
