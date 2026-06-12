import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CheckDetailPage } from './pages/CheckDetailPage';
import { SubmitPage } from './pages/SubmitPage';
import { DashboardPage } from './pages/DashboardPage';
import { SpotChecksPage } from './pages/SpotChecksPage';
import { SpotCheckCreatePage } from './pages/SpotCheckCreatePage';
import { SpotCheckDetailPage } from './pages/SpotCheckDetailPage';
import { SpotCheckRespondPage } from './pages/SpotCheckRespondPage';

export default function VmComplianceRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="checks/:id" element={<CheckDetailPage />} />
      <Route path="submit" element={<SubmitPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="spot-checks" element={<SpotChecksPage />} />
      <Route path="spot-checks/new" element={<SpotCheckCreatePage />} />
      <Route path="spot-checks/:id" element={<SpotCheckDetailPage />} />
      <Route path="spot-checks/:id/respond" element={<SpotCheckRespondPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
