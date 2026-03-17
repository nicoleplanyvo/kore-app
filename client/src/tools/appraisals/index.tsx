import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AppraisalDetailPage } from './pages/AppraisalDetailPage';
import { CreatePage } from './pages/CreatePage';
import { DashboardPage } from './pages/DashboardPage';

export default function AppraisalsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreatePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="appraisals/:id" element={<AppraisalDetailPage />} />
    </Routes>
  );
}
