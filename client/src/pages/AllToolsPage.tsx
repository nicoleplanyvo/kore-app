import {
  Wrench,
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen, BarChart3, Wallet,
  LineChart, Package, Monitor, Activity, Palette, GraduationCap,
  Clock, Trophy, UserPlus, MessageSquare, Compass, Star, CalendarDays,
  Heart, Smile, FileText, ArrowLeftRight, Bell, Mail, Navigation,
  Map, LayoutDashboard, PackageSearch, Shield, type LucideIcon,
} from 'lucide-react';
import { useMyTools } from '../hooks/useMyTools';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import { useNavigate } from 'react-router-dom';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import { CATEGORY_ORDER } from '../lib/moduleCategories';

const iconMap: Record<string, LucideIcon> = {
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen,
  BarChart3, Wallet, LineChart, Shield, Package,
  Monitor, Activity, Palette, Wrench,
  GraduationCap, Clock, Trophy, UserPlus,
  MessageSquare, Compass, Star, CalendarDays, Heart, Smile,
  FileText, ArrowLeftRight, Bell, Mail,
  PackageSearch, Navigation, Map, LayoutDashboard,
};

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

const categoryColors: Record<string, string> = {
  STANDARDS_COMPLIANCE: 'from-blue-500/10 to-indigo-500/10 border-blue-200/50',
  PERFORMANCE: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/50',
  FLOOR: 'from-violet-500/10 to-purple-500/10 border-violet-200/50',
  TRAINING: 'from-amber-500/10 to-orange-500/10 border-amber-200/50',
  COACHING_PEOPLE: 'from-rose-500/10 to-pink-500/10 border-rose-200/50',
  KOMMUNIKATION: 'from-sky-500/10 to-cyan-500/10 border-sky-200/50',
  CUSTOMER_STOCK: 'from-kore-brass/10 to-yellow-500/10 border-kore-brass-lt/50',
  REGIONAL_INSIGHTS: 'from-slate-500/10 to-gray-500/10 border-slate-200/50',
};

const categoryIconColors: Record<string, string> = {
  STANDARDS_COMPLIANCE: 'text-blue-600 bg-blue-50',
  PERFORMANCE: 'text-emerald-600 bg-emerald-50',
  FLOOR: 'text-violet-600 bg-violet-50',
  TRAINING: 'text-amber-600 bg-amber-50',
  COACHING_PEOPLE: 'text-rose-600 bg-rose-50',
  KOMMUNIKATION: 'text-sky-600 bg-sky-50',
  CUSTOMER_STOCK: 'text-kore-brass bg-kore-brass/10',
  REGIONAL_INSIGHTS: 'text-slate-600 bg-slate-50',
};

export function AllToolsPage() {
  const { isOperator, isConfigurator } = useEffectiveRole();
  const { data: myTools, isLoading } = useMyTools();
  const navigate = useNavigate();

  const grouped: Record<string, NonNullable<typeof myTools>> = {};
  for (const assignment of myTools || []) {
    const cat = assignment.tool.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(assignment);
  }

  return (
    <div>
      <div className="mb-xl">
        <h1 className="font-display text-h1 text-kore-ink">
          {isOperator ? 'Meine Tools' : 'Alle Tools'}
        </h1>
        <p className="font-body text-body text-kore-mid mt-xs">
          {isOperator
            ? 'Alle dir zugewiesenen Tools nach Kategorie'
            : 'Tools konfigurieren & auswerten'}
        </p>
      </div>

      {isLoading ? (
        <div className="py-xl text-center">
          <div className="inline-block w-8 h-8 border-2 border-kore-brass border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-kore-mid mt-md">Tools werden geladen...</p>
        </div>
      ) : !myTools || myTools.length === 0 ? (
        <div className="bg-kore-white border border-kore-border rounded-lg p-2xl text-center shadow-sm">
          <div className="w-16 h-16 bg-kore-surface rounded-full flex items-center justify-center mx-auto mb-lg">
            <Wrench size={28} className="text-kore-mid" />
          </div>
          <p className="font-body text-body text-kore-ink">Keine Tools zugewiesen.</p>
          <p className="font-body text-small text-kore-mid mt-xs">
            Kontaktiere deinen Administrator, um Tools freizuschalten.
          </p>
        </div>
      ) : (
        <div className="space-y-xl">
          {CATEGORY_ORDER
            .filter((cat) => grouped[cat]?.length)
            .map((category, catIdx) => (
              <div key={category} className="animate-slide-up" style={{ animationDelay: `${catIdx * 50}ms` }}>
                <h3 className="font-body text-caption text-kore-mid uppercase mb-md">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
                  {grouped[category]!.map((assignment) => {
                    const tool = assignment.tool;
                    const Icon = iconMap[tool.icon || ''] || Wrench;
                    const route = TOOL_ROUTES[tool.key];
                    const iconColor = categoryIconColors[category] || 'text-kore-ink bg-kore-surface';

                    return (
                      <div
                        key={tool.id}
                        className={`bg-kore-white border border-kore-border rounded-lg p-lg flex items-start gap-md shadow-card transition-all duration-200 ${
                          route
                            ? 'cursor-pointer hover:shadow-card-hover hover:border-kore-brass/30 hover:-translate-y-[1px] active:translate-y-0 active:shadow-card'
                            : 'opacity-50'
                        }`}
                        onClick={() => route && navigate(route)}
                      >
                        <div className={`w-[42px] h-[42px] rounded-md flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-body text-kore-ink font-medium truncate">
                            {tool.name}
                          </p>
                          {tool.description && (
                            <p className="font-body text-small text-kore-mid mt-xs line-clamp-2 leading-relaxed">
                              {tool.description}
                            </p>
                          )}
                          {!route && (
                            <span className="inline-block mt-sm px-sm py-[2px] bg-kore-brass/10 text-kore-brass font-body text-caption rounded-sm">
                              Bald verfügbar
                            </span>
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
