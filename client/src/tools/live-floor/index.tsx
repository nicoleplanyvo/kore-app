import { Routes, Route, Navigate } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ZoneManagePage } from './pages/ZoneManagePage';
import { PositionBoardPage } from './pages/PositionBoardPage';

export default function LiveFloorTool() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="zones" element={<ZoneManagePage />} />
      <Route path="board" element={<PositionBoardPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
