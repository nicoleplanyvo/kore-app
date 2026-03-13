import { Routes, Route } from 'react-router-dom';
import { LibraryPage } from './pages/LibraryPage';
import { DocumentPage } from './pages/DocumentPage';
import { CreateEditPage } from './pages/CreateEditPage';
import { AcknowledgmentPage } from './pages/AcknowledgmentPage';

export default function SopBibliothekRoutes() {
  return (
    <Routes>
      <Route index element={<LibraryPage />} />
      <Route path="documents/new" element={<CreateEditPage />} />
      <Route path="documents/:id" element={<DocumentPage />} />
      <Route path="documents/:id/edit" element={<CreateEditPage />} />
      <Route path="acknowledgments" element={<AcknowledgmentPage />} />
    </Routes>
  );
}
