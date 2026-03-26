import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-lg text-center">
      <span className="font-display text-display text-kore-faint">404</span>
      <p className="text-body text-kore-mid mt-md mb-xl">
        Diese Seite wurde nicht gefunden.
      </p>
      <Link to="/">
        <Button variant="secondary">
          <Home size={16} className="mr-sm" />
          Zur Startseite
        </Button>
      </Link>
    </div>
  );
}
