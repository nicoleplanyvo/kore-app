import { Crown, Shield, MapPin, Building, Users, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserRole } from '@shared/types';

interface RoleWelcomeProps {
  role: UserRole;
  userName: string;
  isFirstLogin?: boolean;
}

const roleConfig: Record<UserRole, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  quickActions: Array<{ label: string; href: string; icon: React.ComponentType<any> }>;
}> = {
  kore_admin: {
    title: 'Super Admin',
    subtitle: 'Vollzugriff auf die gesamte KORE Plattform',
    description: 'Du verwaltest Kunden, konfigurierst Tools und überwachst die Plattform-Performance. Deine Rolle hat die höchsten Berechtigungen.',
    icon: Crown,
    color: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.1)',
    quickActions: [
      { label: 'Kunden verwalten', href: '/admin/tenants', icon: Building },
      { label: 'System-Status', href: '/admin', icon: Shield },
      { label: 'Buchhaltung', href: '/admin/buchhaltung', icon: Users }
    ]
  },
  tenant_admin: {
    title: 'Administrator',
    subtitle: 'Vollzugriff auf dein Unternehmen',
    description: 'Du verwaltest alle Stores deines Unternehmens, konfigurierst Tools und siehst alle Reports. Du kannst User erstellen und Berechtigungen vergeben.',
    icon: Shield,
    color: '#c15c42',
    bgColor: 'rgba(193, 92, 66, 0.1)',
    quickActions: [
      { label: 'Stores verwalten', href: '/admin/stores', icon: Building },
      { label: 'User verwalten', href: '/admin/users', icon: Users },
      { label: 'Reports', href: '/admin/reporting', icon: BookOpen }
    ]
  },
  regional_manager: {
    title: 'Regional Manager',
    subtitle: 'Mehrere Stores in deiner Region',
    description: 'Du überwachst die Performance mehrerer Stores, vergleichst KPIs und coachst Store Manager. Du siehst regionsweite Trends und Standards.',
    icon: MapPin,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    quickActions: [
      { label: 'Regional Dashboard', href: '/tools/rm-dashboard', icon: MapPin },
      { label: 'Store Vergleich', href: '/tools/multi-store', icon: Building },
      { label: 'Coaching', href: '/tools/coaching', icon: Users }
    ]
  },
  multisite_manager: {
    title: 'Multisite Manager',
    subtitle: 'Mehrere Stores unter deiner Verantwortung',
    description: 'Du managst mehrere Stores, überwachst deren Performance und stellst sicher dass Standards eingehalten werden.',
    icon: Building,
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    quickActions: [
      { label: 'Store Übersicht', href: '/tools/multi-store', icon: Building },
      { label: 'Standards prüfen', href: '/tools/store-standards', icon: Shield },
      { label: 'KPI Dashboard', href: '/tools/kpi', icon: BookOpen }
    ]
  },
  store_manager: {
    title: 'Store Manager',
    subtitle: 'Führung deines Stores',
    description: 'Du leitest den täglichen Betrieb deines Stores, führst dein Team und stellst sicher dass alle Ziele erreicht werden.',
    icon: Users,
    color: '#c15c42',
    bgColor: 'rgba(193, 92, 66, 0.1)',
    quickActions: [
      { label: 'Mein Tag', href: '/my-day', icon: BookOpen },
      { label: 'Team verwalten', href: '/admin/users', icon: Users },
      { label: 'KPIs erfassen', href: '/tools/kpi', icon: Building }
    ]
  },
  learner: {
    title: 'Mitarbeiter',
    subtitle: 'Teil des Store-Teams',
    description: 'Du hilfst dabei den Store-Betrieb reibungslos zu gestalten, erledigst Aufgaben und lernst kontinuierlich dazu.',
    icon: BookOpen,
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    quickActions: [
      { label: 'Meine Aufgaben', href: '/tools/checklisten', icon: BookOpen },
      { label: 'Schulungen', href: '/tools/training-hub', icon: Users },
      { label: 'Tools entdecken', href: '/tools', icon: Building }
    ]
  }
};

export function RoleWelcome({ role, userName, isFirstLogin = false }: RoleWelcomeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const firstName = userName.split(' ')[0];

  return (
    <div className="bg-kore-white border border-kore-border mb-xl">
      <div 
        className="p-xl border-l-[4px]" 
        style={{ 
          borderLeftColor: config.color, 
          backgroundColor: config.bgColor 
        }}
      >
        <div className="flex items-start gap-lg">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.color }}
          >
            <Icon size={28} className="text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-sm mb-xs">
              {isFirstLogin && (
                <span className="inline-flex items-center px-sm py-[2px] bg-kore-brass/20 text-kore-brass text-[0.65rem] font-medium uppercase tracking-[0.08em] rounded-sm">
                  Willkommen
                </span>
              )}
              <h2 className="font-display text-h3 text-kore-ink">
                {isFirstLogin ? `Willkommen, ${firstName}!` : `Hallo, ${firstName}`}
              </h2>
            </div>
            
            <div className="mb-md">
              <h3 className="font-body text-body font-medium text-kore-ink mb-xs">
                {config.title}
              </h3>
              <p className="font-body text-small text-kore-mid mb-sm">
                {config.subtitle}
              </p>
              <p className="font-body text-small text-kore-mid/80 leading-relaxed">
                {config.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-sm">
              {config.quickActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className="inline-flex items-center gap-xs px-md py-sm bg-kore-white border border-kore-border hover:border-kore-mid hover:bg-kore-surface transition-colors text-small"
                  >
                    <ActionIcon size={14} />
                    <span>{action.label}</span>
                    <ArrowRight size={12} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}