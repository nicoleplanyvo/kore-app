import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { OrderDetailPage } from './pages/OrderDetailPage';

export default function TrackTraceRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
    </Routes>
  );
}
