import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { EntryListPage } from './pages/EntryListPage';
import { TrendsPage } from './pages/TrendsPage';

export default function FrTrackingTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="entries" element={<EntryListPage />} />
      <Route path="trends" element={<TrendsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
