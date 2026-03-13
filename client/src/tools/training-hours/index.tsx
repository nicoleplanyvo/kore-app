import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { LogListPage } from './pages/LogListPage';
import { SummaryPage } from './pages/SummaryPage';

export default function TrainingHoursTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="logs" element={<LogListPage />} />
      <Route path="summary" element={<SummaryPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
