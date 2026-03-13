import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { PlanDetailPage } from './pages/PlanDetailPage';

export default function PdpPipRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="plans/:id" element={<PlanDetailPage />} />
    </Routes>
  );
}
