import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ClientDetailPage } from './pages/ClientDetailPage';

export default function ClientelingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="clients/:id" element={<ClientDetailPage />} />
    </Routes>
  );
}
