import {
  Wrench,
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen, BarChart3, Wallet,
  LineChart, Package, Monitor, Activity, Palette, GraduationCap,
  Clock, Trophy, UserPlus, MessageSquare, Compass, Star, CalendarDays,
  Heart, Smile, FileText, ArrowLeftRight, Bell, Mail, Navigation,
  Map, LayoutDashboard, PackageSearch, Shield, type LucideIcon,
} from 'lucide-react';
import { useMyTools } from '../hooks/useMyTools';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import { CATEGORY_ORDER } from '../lib/moduleCategories';

// Icon-Mapping
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

// Rollen-Labels
const roleLabels: Record<string, string> = {
  kore_admin: 'Plattform-Admin',
  tenant_admin: 'Administrator',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

export function ToolsHomePage() {
  const { user } = useAuthStore();
  const { data: myTools, isLoading } = useMyTools();
  const navigate = useNavigate();

  // Gruppiere nach Kategorie
  const grouped: Record<string, NonNullable<typeof myTools>> = {};
  for (const assignment of myTools || []) {
    const cat = assignment.tool.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(assignment);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">
          Hallo, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="font-body text-small text-kore-mid mt-xs">
          {roleLabels[user?.role || ''] || user?.role}
        </p>
      </div>

      {/* Tool-Cards */}
      <h2 className="font-display text-h3 text-kore-ink mb-lg">Meine Tools</h2>

      {isLoading ? (
        <div className="py-xl text-center">
          <p className="font-body text-kore-mid">Tools werden geladen...</p>
        </div>
      ) : !myTools || myTools.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <Wrench size={32} className="text-kore-mid/30 mx-auto mb-md" />
          <p className="font-body text-kore-mid">Keine Tools zugewiesen.</p>
          <p className="font-body text-small text-kore-mid/60 mt-xs">
            Kontaktieren Sie Ihren Administrator, um Tools freizuschalten.
          </p>
        </div>
      ) : (
        <div className="space-y-xl">
          {CATEGORY_ORDER
            .filter((cat) => grouped[cat]?.length)
            .map((category) => (
              <div key={category}>
                <h3 className="font-body text-caption text-kore-mid uppercase tracking-[0.14em] mb-md">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
                  {grouped[category]!.map((assignment) => {
                    const tool = assignment.tool;
                    const Icon = iconMap[tool.icon || ''] || Wrench;
                    const route = TOOL_ROUTES[tool.key];

                    return (
                      <div
                        key={tool.id}
                        className={`bg-kore-white border border-kore-border p-lg flex items-start gap-md transition-colors ${
                          route
                            ? 'cursor-pointer hover:border-kore-brass/40 hover:bg-kore-surface'
                            : 'opacity-60'
                        }`}
                        onClick={() => route && navigate(route)}
                      >
                        <div className="w-[36px] h-[36px] bg-kore-surface flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-kore-ink" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-small text-kore-ink font-normal truncate">
                            {tool.name}
                          </p>
                          {tool.description && (
                            <p className="font-body text-[0.65rem] text-kore-mid mt-xs line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                          {!route && (
                            <p className="font-body text-[0.6rem] text-kore-brass mt-xs">
                              Bald verfuegbar
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
