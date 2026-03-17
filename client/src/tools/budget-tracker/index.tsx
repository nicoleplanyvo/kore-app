import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { DetailPage } from './pages/DetailPage';
import { DashboardPage } from './pages/DashboardPage';

export default function BudgetTrackerRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="detail" element={<DetailPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
