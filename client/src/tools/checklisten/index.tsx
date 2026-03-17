import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ChecklistDetailPage } from './pages/ChecklistDetailPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { DashboardPage } from './pages/DashboardPage';

export function ChecklistenRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="checklists/:id" element={<ChecklistDetailPage />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
