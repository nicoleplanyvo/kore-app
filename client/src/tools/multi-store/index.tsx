import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { RankingPage } from './pages/RankingPage';

export default function MultiStoreRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="comparison" element={<ComparisonPage />} />
      <Route path="ranking" element={<RankingPage />} />
    </Routes>
  );
}
