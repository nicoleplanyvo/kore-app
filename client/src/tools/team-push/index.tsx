import { Routes, Route } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { MessageDetailPage } from './pages/MessageDetailPage';

export default function TeamPushRoutes() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="messages/:id" element={<MessageDetailPage />} />
    </Routes>
  );
}
