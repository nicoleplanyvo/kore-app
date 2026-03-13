import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { IncidentListPage } from './pages/IncidentListPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';

export default function LossPreventionRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="incidents" element={<IncidentListPage />} />
      <Route path="incidents/:id" element={<IncidentDetailPage />} />
    </Routes>
  );
}
