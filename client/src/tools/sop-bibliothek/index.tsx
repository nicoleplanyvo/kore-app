import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SopDetailPage } from './pages/SopDetailPage';
import { CreateEditPage } from './pages/CreateEditPage';
import { DashboardPage } from './pages/DashboardPage';

export default function SopBibliothekRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreateEditPage />} />
      <Route path="sops/:id" element={<SopDetailPage />} />
      <Route path="sops/:id/edit" element={<CreateEditPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
