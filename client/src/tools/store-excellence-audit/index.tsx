import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { AuditDetailPage } from './pages/AuditDetailPage';
import { CreateAuditPage } from './pages/CreateAuditPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { DashboardPage } from './pages/DashboardPage';
import { FollowUpsPage } from './pages/FollowUpsPage';

export function StoreExcellenceAuditRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="create" element={<CreateAuditPage />} />
      <Route path="audits/:id" element={<AuditDetailPage />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="follow-ups" element={<FollowUpsPage />} />
    </Routes>
  );
}
