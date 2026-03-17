import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ShiftDetailPage } from './pages/ShiftDetailPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { DashboardPage } from './pages/DashboardPage';

export default function ShiftPlanningRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="shifts/:id" element={<ShiftDetailPage />} />
      <Route path="availability" element={<AvailabilityPage />} />
      <Route path="time-tracking" element={<TimeTrackingPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
