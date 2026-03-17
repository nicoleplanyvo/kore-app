import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CreateCustomerPage } from './pages/CreateCustomerPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DashboardPage } from './pages/DashboardPage';

export default function ClientelingRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="customers/create" element={<CreateCustomerPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
