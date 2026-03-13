import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { WeekViewPage } from './pages/WeekViewPage';
import { TemplateManagePage } from './pages/TemplateManagePage';

export default function ShiftPlanningRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="week" element={<WeekViewPage />} />
      <Route path="templates" element={<TemplateManagePage />} />
    </Routes>
  );
}
