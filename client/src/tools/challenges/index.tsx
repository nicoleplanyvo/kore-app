import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';

export default function ChallengesTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path=":id" element={<ChallengeDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
