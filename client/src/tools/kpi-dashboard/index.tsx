import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { EntryListPage } from './pages/EntryListPage';
import { TrendsPage } from './pages/TrendsPage';

export default function KpiDashboardRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="entries" element={<EntryListPage />} />
      <Route path="trends" element={<TrendsPage />} />
    </Routes>
  );
}
