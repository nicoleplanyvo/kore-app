import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-dvh bg-kore-bg flex items-center justify-center px-lg py-xl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-2xl">
          <h1 className="font-display text-h1 text-kore-ink tracking-wider">KORE</h1>
          <p className="text-caption text-kore-mid uppercase tracking-widest mt-sm">
            Retail Excellence
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
