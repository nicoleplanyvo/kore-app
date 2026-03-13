import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ComparisonPage } from './pages/ComparisonPage';

export default function FrConversionRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="analysis" element={<AnalysisPage />} />
      <Route path="comparison" element={<ComparisonPage />} />
    </Routes>
  );
}
