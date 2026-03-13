import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CalloutDetailPage } from './pages/CalloutDetailPage';

export default function StockCalloutsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="callouts/:id" element={<CalloutDetailPage />} />
    </Routes>
  );
}
