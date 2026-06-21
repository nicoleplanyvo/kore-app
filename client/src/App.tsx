import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AllToolsPage } from './pages/AllToolsPage';
import { HomePage } from './pages/HomePage';
import { ScrollToTop } from './components/ScrollToTop';

// Admin-Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { TenantsListPage } from './pages/admin/TenantsListPage';
import { TenantCreatePage } from './pages/admin/TenantCreatePage';
import { TenantDetailPage } from './pages/admin/TenantDetailPage';
import { ToolsOverviewPage } from './pages/admin/ToolsOverviewPage';
import { StoresListPage } from './pages/admin/StoresListPage';
import { StoreDetailPage } from './pages/admin/StoreDetailPage';
import { UsersListPage } from './pages/admin/UsersListPage';
import { UserCreatePage } from './pages/admin/UserCreatePage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import GdprPage from './pages/admin/GdprPage';
import { ReportingPage } from './pages/admin/ReportingPage';
import { BillingOverviewPage } from './pages/admin/BillingOverviewPage';
import { InvoiceCreatePage } from './pages/admin/InvoiceCreatePage';
import { InvoiceDetailPage } from './pages/admin/InvoiceDetailPage';

// Tool-Routes
import { StoreExcellenceAuditRoutes } from './tools/store-excellence-audit/index';
import { ChecklistenRoutes } from './tools/checklisten/index';
import SopBibliothekRoutes from './tools/sop-bibliothek/index';
import VmComplianceRoutes from './tools/vm-compliance/index';
import StoreStandardsRoutes from './tools/store-standards/index';
import KpiDashboardRoutes from './tools/kpi-dashboard/index';
import BudgetTrackerRoutes from './tools/budget-tracker/index';
import ForecastRoutes from './tools/forecast/index';
import LossPreventionRoutes from './tools/loss-prevention/index';
import InventoryRoutes from './tools/inventory/index';
import LiveFloorRoutes from './tools/live-floor/index';
import FrTrackingRoutes from './tools/fr-tracking/index';
import VmGuidelinesRoutes from './tools/vm-guidelines/index';
import MaintenanceRoutes from './tools/maintenance/index';
import TrainingHubRoutes from './tools/training-hub/index';
import TrainingHoursRoutes from './tools/training-hours/index';
import ChallengesRoutes from './tools/challenges/index';
import OnboardingRoutes from './tools/onboarding/index';
import CoachingRoutes from './tools/coaching/index';
import PdpPipRoutes from './tools/pdp-pip/index';
import AppraisalsRoutes from './tools/appraisals/index';
import ShiftPlanningRoutes from './tools/shift-planning/index';
import PulseSurveyRoutes from './tools/pulse-survey/index';
import WellbeingRoutes from './tools/wellbeing/index';
import BriefingsRoutes from './tools/briefings/index';
import HandoverRoutes from './tools/handover/index';
import TeamPushRoutes from './tools/team-push/index';
import NewsletterRoutes from './tools/newsletter/index';
import FrConversionRoutes from './tools/fr-conversion/index';
import ClientelingRoutes from './tools/clienteling/index';
import StockCalloutsRoutes from './tools/stock-callouts/index';
import TrackTraceRoutes from './tools/track-trace/index';
import MultiStoreRoutes from './tools/multi-store/index';
import RmDashboardRoutes from './tools/rm-dashboard/index';
import { MyDayPage } from './pages/MyDayPage';
import MetrixRoutes from './tools/metrix/index';

export function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
        {/* Login */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Geschützter App-Bereich */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Home — rollenspezifisches Dashboard */}
            <Route path="/" element={<HomePage />} />

            {/* Mein Tag — Store Manager Tages-Dashboard */}
            <Route path="/my-day" element={<MyDayPage />} />

            {/* Alle Tools */}
            <Route path="/tools" element={<AllToolsPage />} />

            {/* ═══ TOOLS ═══ */}

            {/* Standards & Compliance */}
            <Route path="/tools/sea/*" element={<StoreExcellenceAuditRoutes />} />
            <Route path="/tools/checklisten/*" element={<ChecklistenRoutes />} />
            <Route path="/tools/sop/*" element={<SopBibliothekRoutes />} />
            <Route path="/tools/vm-compliance/*" element={<VmComplianceRoutes />} />
            <Route path="/tools/store-standards/*" element={<StoreStandardsRoutes />} />

            {/* Performance & Sichtbarkeit */}
            <Route path="/tools/kpi/*" element={<KpiDashboardRoutes />} />
            <Route path="/tools/budget/*" element={<BudgetTrackerRoutes />} />
            <Route path="/tools/forecast/*" element={<ForecastRoutes />} />
            <Route path="/tools/loss-prevention/*" element={<LossPreventionRoutes />} />
            <Route path="/tools/inventory/*" element={<InventoryRoutes />} />
            <Route path="/tools/metrix/*" element={<MetrixRoutes />} />

            {/* Floor in Echtzeit */}
            <Route path="/tools/live-floor/*" element={<LiveFloorRoutes />} />
            <Route path="/tools/fr-tracking/*" element={<FrTrackingRoutes />} />
            <Route path="/tools/vm-guidelines/*" element={<VmGuidelinesRoutes />} />
            <Route path="/tools/maintenance/*" element={<MaintenanceRoutes />} />

            {/* Training & Entwicklung */}
            <Route path="/tools/training-hub/*" element={<TrainingHubRoutes />} />
            <Route path="/tools/training-hours/*" element={<TrainingHoursRoutes />} />
            <Route path="/tools/challenges/*" element={<ChallengesRoutes />} />
            <Route path="/tools/onboarding/*" element={<OnboardingRoutes />} />

            {/* Coaching & People */}
            <Route path="/tools/coaching/*" element={<CoachingRoutes />} />
            <Route path="/tools/pdp-pip/*" element={<PdpPipRoutes />} />
            <Route path="/tools/appraisals/*" element={<AppraisalsRoutes />} />
            <Route path="/tools/shift-planning/*" element={<ShiftPlanningRoutes />} />
            <Route path="/tools/pulse-survey/*" element={<PulseSurveyRoutes />} />
            <Route path="/tools/wellbeing/*" element={<WellbeingRoutes />} />

            {/* Kommunikation & Signal */}
            <Route path="/tools/briefings/*" element={<BriefingsRoutes />} />
            <Route path="/tools/handover/*" element={<HandoverRoutes />} />
            <Route path="/tools/team-push/*" element={<TeamPushRoutes />} />
            <Route path="/tools/newsletter/*" element={<NewsletterRoutes />} />

            {/* Customer, Clienteling & Stock */}
            <Route path="/tools/fr-conversion/*" element={<FrConversionRoutes />} />
            <Route path="/tools/clienteling/*" element={<ClientelingRoutes />} />
            <Route path="/tools/stock-callouts/*" element={<StockCalloutsRoutes />} />
            <Route path="/tools/track-trace/*" element={<TrackTraceRoutes />} />

            {/* Regional Insights */}
            <Route path="/tools/multi-store/*" element={<MultiStoreRoutes />} />
            <Route path="/tools/rm-dashboard/*" element={<RmDashboardRoutes />} />

            {/* ═══ ADMIN ═══ */}

            {/* Admin-Dashboard (store_manager+) */}
            <Route element={<ProtectedRoute minRole="store_manager" />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/users" element={<UsersListPage />} />
              <Route path="/admin/users/new" element={<UserCreatePage />} />
              <Route path="/admin/users/:id" element={<UserDetailPage />} />
              <Route path="/admin/stores" element={<StoresListPage />} />
              <Route path="/admin/stores/:id" element={<StoreDetailPage />} />
            </Route>

            {/* Tool-Katalog / Buchung (regional_manager+) */}
            <Route element={<ProtectedRoute minRole="regional_manager" />}>
              <Route path="/admin/tools" element={<ToolsOverviewPage />} />
            </Route>

            {/* GDPR & Reporting (tenant_admin+) */}
            <Route element={<ProtectedRoute minRole="tenant_admin" />}>
              <Route path="/admin/gdpr" element={<GdprPage />} />
              <Route path="/admin/reporting" element={<ReportingPage />} />
            </Route>

            {/* Nur kore_admin */}
            <Route element={<ProtectedRoute minRole="kore_admin" />}>
              <Route path="/admin/tenants" element={<TenantsListPage />} />
              <Route path="/admin/tenants/new" element={<TenantCreatePage />} />
              <Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
              <Route path="/admin/buchhaltung" element={<BillingOverviewPage />} />
              <Route path="/admin/buchhaltung/neu" element={<InvoiceCreatePage />} />
              <Route path="/admin/buchhaltung/:id" element={<InvoiceDetailPage />} />
            </Route>
          </Route>
        </Route>

        {/* Redirect alte /app URLs */}
        <Route path="/app/*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
