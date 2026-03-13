import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CheckInPage } from './pages/CheckInPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { TrendsPage } from './pages/TrendsPage';

export default function WellbeingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="checkin" element={<CheckInPage />} />
      <Route path="resources" element={<ResourceListPage />} />
      <Route path="trends" element={<TrendsPage />} />
    </Routes>
  );
}
