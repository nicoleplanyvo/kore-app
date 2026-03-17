import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SurveyDetailPage } from './pages/SurveyDetailPage';
import { RespondPage } from './pages/RespondPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResultsPage } from './pages/ResultsPage';

export default function PulseSurveyRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="surveys/:id" element={<SurveyDetailPage />} />
      <Route path="surveys/:id/respond" element={<RespondPage />} />
      <Route path="surveys/:id/results" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
