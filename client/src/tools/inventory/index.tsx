import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CountListPage } from './pages/CountListPage';
import { CountDetailPage } from './pages/CountDetailPage';

export default function InventoryRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="counts" element={<CountListPage />} />
      <Route path="counts/:id" element={<CountDetailPage />} />
    </Routes>
  );
}
