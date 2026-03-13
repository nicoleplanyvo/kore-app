import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { SurveyDetailPage } from './pages/SurveyDetailPage';
import { RespondPage } from './pages/RespondPage';

export default function PulseSurveyRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="surveys/:id" element={<SurveyDetailPage />} />
      <Route path="surveys/:id/respond" element={<RespondPage />} />
    </Routes>
  );
}
