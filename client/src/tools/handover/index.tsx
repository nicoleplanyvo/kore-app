import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { HandoverDetailPage } from './pages/HandoverDetailPage';

export default function HandoverRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path=":id" element={<HandoverDetailPage />} />
    </Routes>
  );
}
