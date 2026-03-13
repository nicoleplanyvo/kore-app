import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-kore-bg flex items-center justify-center px-md">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-2xl">
          <h1 className="font-display text-h2 text-kore-ink tracking-wide">KORE</h1>
          <p className="font-body text-small text-kore-mid mt-sm">Retail Platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
