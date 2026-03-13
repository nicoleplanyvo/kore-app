import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { DefinitionsPage } from './pages/DefinitionsPage';
import { EvaluationListPage } from './pages/EvaluationListPage';
import { NewEvaluationPage } from './pages/NewEvaluationPage';
import { ConductEvaluationPage } from './pages/ConductEvaluationPage';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';

export default function StoreStandardsRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="definitions" element={<DefinitionsPage />} />
      <Route path="evaluations" element={<EvaluationListPage />} />
      <Route path="evaluations/new" element={<NewEvaluationPage />} />
      <Route path="evaluations/:id" element={<EvaluationDetailPage />} />
      <Route path="evaluations/:id/conduct" element={<ConductEvaluationPage />} />
    </Routes>
  );
}
