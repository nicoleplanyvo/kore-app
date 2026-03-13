import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { PeriodListPage } from './pages/PeriodListPage';
import { PeriodDetailPage } from './pages/PeriodDetailPage';

export default function BudgetTrackerRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="periods" element={<PeriodListPage />} />
      <Route path="periods/:id" element={<PeriodDetailPage />} />
    </Routes>
  );
}
