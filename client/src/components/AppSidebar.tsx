import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, X, Wrench,
  Users, Store, Settings, ShieldCheck, BarChart, Building2, CreditCard,
  Fingerprint,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMyTools } from '../hooks/useMyTools';
import { useRecentTools } from '../hooks/useRecentTools';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import { api } from '../lib/api';

import {
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen, BarChart3, Wallet,
  LineChart, Package, Monitor, Activity, Palette, GraduationCap,
  Clock, Trophy, UserPlus, MessageSquare, Compass, Star, CalendarDays,
  Heart, Smile, FileText, ArrowLeftRight, Bell, Mail, Navigation,
  Map as MapIcon, PackageSearch, Shield,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen,
  BarChart3, Wallet, LineChart, Shield, Package,
  Monitor, Activity, Palette, Wrench,
  GraduationCap, Clock, Trophy, UserPlus,
  MessageSquare, Compass, Star, CalendarDays, Heart, Smile,
  FileText, ArrowLeftRight, Bell, Mail,
  PackageSearch, Navigation, Map: MapIcon, LayoutDashboard,
};

const ROLE_LEVELS: Record<string, number> = {
  learner: 0, store_manager: 1, multisite_manager: 2,
  regional_manager: 3, tenant_admin: 4, kore_admin: 5,
};

function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[minRole] ?? 99);
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { user, clearAuth, viewAsRole } = useAuthStore();
  const effectiveRole = viewAsRole || user?.role || '';
  const { data: myTools } = useMyTools();
  const { recentTools } = useRecentTools();

  const toolLookup = new Map<string, { name: string; icon: LucideIcon; route: string }>();
  for (const assignment of myTools || []) {
    const route = TOOL_ROUTES[assignment.tool.key];
    if (!route) continue;
    toolLookup.set(assignment.tool.key, {
      name: assignment.tool.name,
      icon: iconMap[assignment.tool.icon || ''] || Wrench,
      route,
    });
  }

  const recentItems = recentTools
    .map((r) => {
      const info = toolLookup.get(r.toolKey);
      if (!info) return null;
      return { key: r.toolKey, ...info };
    })
    .filter(Boolean)
    .slice(0, 6) as Array<{ key: string; name: string; icon: LucideIcon; route: string }>;

  const displayTools = recentItems.length > 0
    ? recentItems
    : Array.from(toolLookup.entries()).slice(0, 6).map(([key, info]) => ({ key, ...info }));

  const handleLogout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    clearAuth();
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-md-sm px-md py-[10px] rounded-md mb-xs transition-all duration-200 ${
      isActive
        ? 'bg-kore-brass/15 text-kore-brass-lt font-medium'
        : 'text-kore-faint hover:text-kore-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-kore-ink flex flex-col
        transform transition-transform duration-300 ease-out
        lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="px-lg py-xl border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-h3 text-kore-white tracking-wider">KORE</h1>
            <p className="font-body text-[0.65rem] text-kore-brass uppercase tracking-[0.16em] mt-xs">
              Retail Platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-kore-faint hover:text-kore-white transition-colors p-sm rounded-md hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-lg px-md-sm overflow-y-auto">
          <NavLink to="/" end onClick={onClose} className={linkClasses}>
            <LayoutDashboard size={18} />
            <span className="font-body text-small">Dashboard</span>
          </NavLink>

          {/* Recent Tools */}
          {displayTools.length > 0 && (
            <div className="mt-lg">
              <p className="font-body text-caption text-kore-faint/40 px-md mb-sm">
                Zuletzt verwendet
              </p>
              {displayTools.map((item) => (
                <NavLink key={item.key} to={item.route} onClick={onClose} className={linkClasses}>
                  <item.icon size={18} />
                  <span className="font-body text-small truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* All Tools Button */}
          <div className="px-sm mt-lg mb-md">
            <NavLink
              to="/tools"
              onClick={onClose}
              className="flex items-center justify-center py-[10px] rounded-md border border-white/10 text-kore-faint hover:text-kore-white hover:border-kore-brass/40 hover:bg-kore-brass/5 transition-all duration-200 font-body text-small"
            >
              Alle Tools anzeigen
            </NavLink>
          </div>

          {/* Admin */}
          {user && hasMinRole(effectiveRole, 'store_manager') && (
            <div className="mt-lg">
              <p className="font-body text-caption text-kore-brass/50 px-md mb-sm">
                Administration
              </p>
              <NavLink to="/admin/users" onClick={onClose} className={linkClasses}>
                <Users size={18} />
                <span className="font-body text-small">Benutzer</span>
              </NavLink>
              <NavLink to="/admin/stores" onClick={onClose} className={linkClasses}>
                <Store size={18} />
                <span className="font-body text-small">Stores</span>
              </NavLink>
              {hasMinRole(effectiveRole, 'regional_manager') && (
                <NavLink to="/admin/tools" onClick={onClose} className={linkClasses}>
                  <Settings size={18} />
                  <span className="font-body text-small">Tools</span>
                </NavLink>
              )}
            </div>
          )}

          {/* Platform (kore_admin) */}
          {user && hasMinRole(effectiveRole, 'tenant_admin') && (
            <div className="mt-lg">
              <p className="font-body text-caption text-kore-brass/50 px-md mb-sm">
                Plattform
              </p>
              {hasMinRole(effectiveRole, 'kore_admin') && (
                <>
                  <NavLink to="/admin/onboarding" onClick={onClose} className={linkClasses}>
                    <UserPlus size={18} />
                    <span className="font-body text-small">Kunde anlegen</span>
                  </NavLink>
                  <NavLink to="/admin/tenants" onClick={onClose} className={linkClasses}>
                    <Building2 size={18} />
                    <span className="font-body text-small">Kunden</span>
                  </NavLink>
                  <NavLink to="/admin/buchhaltung" onClick={onClose} className={linkClasses}>
                    <CreditCard size={18} />
                    <span className="font-body text-small">Buchhaltung</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/admin/reporting" onClick={onClose} className={linkClasses}>
                <BarChart size={18} />
                <span className="font-body text-small">Reporting</span>
              </NavLink>
              <NavLink to="/admin/gdpr" onClick={onClose} className={linkClasses}>
                <ShieldCheck size={18} />
                <span className="font-body text-small">DSGVO</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User + Logout */}
        <div className="px-md-sm py-lg border-t border-white/10">
          {user && (
            <div className="px-md mb-md flex items-center gap-md">
              <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-kore-brass-lt to-kore-brass flex items-center justify-center flex-shrink-0">
                <span className="text-white font-body text-small font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-body text-small text-kore-faint truncate">{user.name}</p>
                <p className="font-body text-[0.65rem] text-kore-faint/50 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <NavLink
            to="/einstellungen/sicherheit"
            onClick={onClose}
            className="flex items-center gap-md-sm px-md py-[10px] text-kore-faint hover:text-kore-brass transition-colors duration-200 w-full font-body text-small rounded-md hover:bg-white/5"
          >
            <Fingerprint size={18} />
            <span>Sicherheit &amp; Passkeys</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-md-sm px-md py-[10px] text-kore-faint hover:text-kore-error transition-colors duration-200 w-full font-body text-small rounded-md hover:bg-white/5"
          >
            <LogOut size={18} />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>
    </>
  );
}
