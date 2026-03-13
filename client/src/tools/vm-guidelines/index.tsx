import { Routes, Route, Navigate } from 'react-router-dom';
import { LibraryPage } from './pages/LibraryPage';
import { DetailPage } from './pages/DetailPage';

export default function VmGuidelinesTool() {
  return (
    <Routes>
      <Route index element={<LibraryPage />} />
      <Route path=":id" element={<DetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
