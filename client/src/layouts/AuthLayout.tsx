import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-kore-bg flex items-center justify-center px-md">
      <Outlet />
    </div>
  );
}
