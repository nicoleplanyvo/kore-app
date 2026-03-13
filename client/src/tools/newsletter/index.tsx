import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { NewsletterDetailPage } from './pages/NewsletterDetailPage';

export default function NewsletterRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path=":id" element={<NewsletterDetailPage />} />
    </Routes>
  );
}
