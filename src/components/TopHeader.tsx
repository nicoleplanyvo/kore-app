import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
}

export function TopHeader({ title }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-kore-white/95 backdrop-blur-sm border-b border-kore-border safe-top">
      <div className="flex items-center justify-between h-[52px] px-lg">
        <Link to="/" className="font-display text-h3 text-kore-ink tracking-wider">
          KORE
        </Link>
        {title && (
          <span className="text-caption text-kore-mid uppercase tracking-widest">
            {title}
          </span>
        )}
        <Link
          to="/notifications"
          className="w-10 h-10 flex items-center justify-center text-kore-mid hover:text-kore-brass transition-colors touch-manipulation"
        >
          <Bell size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}
