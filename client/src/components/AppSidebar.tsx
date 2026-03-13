import { NavLink } from 'react-router-dom';
import {
  Home, Wrench, LogOut, X,
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen, BarChart3, Wallet,
  LineChart, Package, Monitor, Activity, Palette, GraduationCap,
  Clock, Trophy, UserPlus, MessageSquare, Compass, Star, CalendarDays,
  Heart, Smile, FileText, ArrowLeftRight, Bell, Mail, Navigation,
  Map, LayoutDashboard, PackageSearch, Shield, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMyTools } from '../hooks/useMyTools';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import { api } from '../lib/api';

// Icon-Mapping: icon-String aus DB -> Lucide-Komponente
const iconMap: Record<string, LucideIcon> = {
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen,
  BarChart3, Wallet, LineChart, Shield, Package,
  Monitor, Activity, Palette, Wrench,
  GraduationCap, Clock, Trophy, UserPlus,
  MessageSquare, Compass, Star, CalendarDays, Heart, Smile,
  FileText, ArrowLeftRight, Bell, Mail,
  PackageSearch, Navigation,
  Map, LayoutDashboard,
};

// Kategorie-Labels
const categoryLabels: Record<string, string> = {
  STANDARDS_COMPLIANCE: 'Standards & Compliance',
  PERFORMANCE: 'Performance & Sichtbarkeit',
  FLOOR: 'Floor in Echtzeit',
  TRAINING: 'Training & Entwicklung',
  COACHING_PEOPLE: 'Coaching & People',
  KOMMUNIKATION: 'Kommunikation & Signal',
  CUSTOMER_STOCK: 'Customer, Clienteling & Stock',
  REGIONAL_INSIGHTS: 'Regional Insights',
};

// Kategorie-Reihenfolge
const categoryOrder = [
  'STANDARDS_COMPLIANCE',
  'PERFORMANCE',
  'FLOOR',
  'TRAINING',
  'COACHING_PEOPLE',
  'KOMMUNIKATION',
  'CUSTOMER_STOCK',
  'REGIONAL_INSIGHTS',
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const { data: myTools } = useMyTools();

  // Tool-Items nach Kategorie gruppieren
  const toolsByCategory: Record<string, Array<{
    key: string;
    to: string;
    icon: LucideIcon;
    label: string;
  }>> = {};

  for (const assignment of myTools || []) {
    const route = TOOL_ROUTES[assignment.tool.key];
    if (!route) continue;
    const cat = assignment.tool.category;
    if (!toolsByCategory[cat]) toolsByCategory[cat] = [];
    toolsByCategory[cat]!.push({
      key: assignment.tool.key,
      to: route,
      icon: iconMap[assignment.tool.icon || ''] || Wrench,
      label: assignment.tool.name,
    });
  }

  const handleLogout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignoriere Fehler beim Logout
    }
    clearAuth();
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-md-sm px-md py-md-sm rounded-sm mb-xs transition-colors duration-200 ${
      isActive
        ? 'bg-white/10 text-kore-brass-lt'
        : 'text-kore-faint hover:text-kore-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] bg-kore-ink flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + Close on mobile */}
        <div className="px-lg py-xl border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-h3 text-kore-white tracking-wider">KORE</h1>
            <p className="font-body text-[0.65rem] text-kore-faint uppercase tracking-[0.16em] mt-xs">
              Retail Platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-kore-faint hover:text-kore-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-lg px-md-sm overflow-y-auto">
          {/* Home */}
          <NavLink
            to="/app"
            end
            onClick={onClose}
            className={linkClasses}
          >
            <Home size={18} />
            <span className="font-body text-small font-normal">Home</span>
          </NavLink>

          {/* Tools nach Kategorie */}
          {categoryOrder
            .filter((cat) => toolsByCategory[cat]?.length)
            .map((cat) => (
              <div key={cat}>
                <p className="font-body text-[0.6rem] text-kore-faint/50 uppercase tracking-[0.16em] px-md mt-lg mb-xs">
                  {categoryLabels[cat] || cat}
                </p>
                {toolsByCategory[cat]!.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    onClick={onClose}
                    className={linkClasses}
                  >
                    <item.icon size={18} />
                    <span className="font-body text-small font-normal">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
        </nav>

        {/* User Info + Logout */}
        <div className="px-md-sm py-lg border-t border-white/10">
          {user && (
            <div className="px-md mb-md">
              <p className="font-body text-[0.7rem] text-kore-faint truncate">{user.name}</p>
              <p className="font-body text-[0.6rem] text-kore-faint/60 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-md-sm px-md py-md-sm text-kore-faint hover:text-kore-error transition-colors duration-200 w-full font-body text-small"
          >
            <LogOut size={18} />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>
    </>
  );
}
