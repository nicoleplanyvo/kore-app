import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { SubmitPage } from './pages/SubmitPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';

export default function VmComplianceRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="guidelines" element={<GuidelinesPage />} />
      <Route path="submit" element={<SubmitPage />} />
      <Route path="review" element={<ReviewQueuePage />} />
      <Route path="submissions/:id" element={<SubmissionDetailPage />} />
    </Routes>
  );
}
