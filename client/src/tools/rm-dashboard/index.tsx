import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AlertsPage } from './pages/AlertsPage';
import { TrendsPage } from './pages/TrendsPage';
import { RankingPage } from './pages/RankingPage';
import { StoreDetailPage } from './pages/StoreDetailPage';

export default function RmDashboardRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="trends" element={<TrendsPage />} />
      <Route path="ranking" element={<RankingPage />} />
      <Route path="store/:storeId" element={<StoreDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
