import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AppraisalDetailPage } from './pages/AppraisalDetailPage';

export default function AppraisalsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="appraisals/:id" element={<AppraisalDetailPage />} />
    </Routes>
  );
}
