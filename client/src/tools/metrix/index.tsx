import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ConfigPage } from './pages/ConfigPage';
import { DashboardPage } from './pages/DashboardPage';

export default function MetrixRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="config" element={<ConfigPage />} />
      <Route path="config/:id" element={<ConfigPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
