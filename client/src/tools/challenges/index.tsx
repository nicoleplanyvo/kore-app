import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { CreatePage } from './pages/CreatePage';
import { DashboardPage } from './pages/DashboardPage';

export default function ChallengesTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreatePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path=":id" element={<ChallengeDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
