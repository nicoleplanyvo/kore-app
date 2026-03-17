import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { TemplateListPage } from './pages/TemplateListPage';
import { JourneyListPage } from './pages/JourneyListPage';
import { JourneyDetailPage } from './pages/JourneyDetailPage';

export default function OnboardingTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="templates" element={<TemplateListPage />} />
      <Route path="journeys" element={<JourneyListPage />} />
      <Route path="journeys/:id" element={<JourneyDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
