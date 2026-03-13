import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ForecastListPage } from './pages/ForecastListPage';
import { ForecastDetailPage } from './pages/ForecastDetailPage';

export default function ForecastRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="list" element={<ForecastListPage />} />
      <Route path=":id" element={<ForecastDetailPage />} />
    </Routes>
  );
}
