import { Link } from 'react-router-dom';
import { ClipboardCheck, ChevronRight, Wrench } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useMyTools } from '../hooks/useTools';
import t from '../locales/de.json';

// Bekannte Tool-Routen
const TOOL_ROUTES: Record<string, string> = {
  'standards.excellence_tracker': '/tools/sea',
};

export function ToolsPage() {
  const { data: tools, isLoading } = useMyTools();

  if (isLoading) return <LoadingSpinner />;

  if (!tools || tools.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title={t.tools.noTools}
        description="Dein Store hat noch keine Tools zugewiesen."
      />
    );
  }

  // Deduplizieren nach Tool-Key
  const uniqueTools = Array.from(
    new Map(tools.map((t) => [t.tool.key, t])).values()
  );

  return (
    <div className="px-lg py-lg space-y-lg max-w-lg mx-auto">
      <h1 className="font-display text-h2 text-kore-ink">{t.tools.title}</h1>

      <div className="space-y-md-sm">
        {uniqueTools.map((assignment) => {
          const route = TOOL_ROUTES[assignment.tool.key];
          const content = (
            <>
              <div className="flex items-center gap-md flex-1 min-w-0">
                <div className="w-12 h-12 bg-kore-surface flex items-center justify-center shrink-0">
                  <ClipboardCheck size={22} className="text-kore-brass" />
                </div>
                <div className="min-w-0">
                  <p className="text-body font-medium text-kore-ink truncate">
                    {assignment.tool.name}
                  </p>
                  {assignment.tool.description && (
                    <p className="text-small text-kore-mid truncate">
                      {assignment.tool.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-sm shrink-0">
                {!route && (
                  <Badge variant="default">{t.tools.comingSoon}</Badge>
                )}
                {route && <ChevronRight size={18} className="text-kore-faint" />}
              </div>
            </>
          );

          if (route) {
            return (
              <Link key={assignment.tool.key} to={route}>
                <Card className="flex items-center justify-between hover:border-kore-brass transition-colors">
                  {content}
                </Card>
              </Link>
            );
          }

          return (
            <Card key={assignment.tool.key} className="flex items-center justify-between opacity-60">
              {content}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
