import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { EnrollmentListPage } from './pages/EnrollmentListPage';

export default function TrainingHubTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="courses/:id" element={<CourseDetailPage />} />
      <Route path="enrollments" element={<EnrollmentListPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
