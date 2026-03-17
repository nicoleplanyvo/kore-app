import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { RevenuePage } from './pages/RevenuePage';
import { MonthlyPage } from './pages/MonthlyPage';
import { SettingsPage } from './pages/SettingsPage';
import { ManagementPage } from './pages/ManagementPage';
import { AssociatesPage } from './pages/AssociatesPage';
import { SummaryPage } from './pages/SummaryPage';

export default function StoreStandardsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="revenue" element={<RevenuePage />} />
      <Route path="monthly" element={<MonthlyPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="management" element={<ManagementPage />} />
      <Route path="associates" element={<AssociatesPage />} />
      <Route path="summary" element={<SummaryPage />} />
    </Routes>
  );
}
