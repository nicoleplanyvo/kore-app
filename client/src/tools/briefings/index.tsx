import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { BriefingDetailPage } from './pages/BriefingDetailPage';

export default function BriefingsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path=":id" element={<BriefingDetailPage />} />
    </Routes>
  );
}
