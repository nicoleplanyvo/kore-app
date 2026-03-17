import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CreatePage } from './pages/CreatePage';
import { BriefingDetailPage } from './pages/BriefingDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function BriefingsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreatePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path=":id" element={<BriefingDetailPage />} />
    </Routes>
  );
}
