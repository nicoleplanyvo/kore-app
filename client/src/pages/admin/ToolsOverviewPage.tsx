import { Badge } from '@/components/ui';
import { useTools, useToolStats, useToggleToolAssignment } from '../../hooks/useTools';
import { TOOL_CATEGORIES, CATEGORY_ORDER } from '../../lib/moduleCategories';
import { Euro, Wrench, BarChart3 } from 'lucide-react';
import { useStores, useStoreTools } from '../../hooks/useStores';
import { useState } from 'react';
import t from '../../locales/de.json';

function StatsCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl flex items-start gap-lg">
      <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0" style={{ background: color || 'var(--kore-surface)' }}>
        <Icon size={20} className="text-kore-ink" />
      </div>
      <div>
        <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">{label}</p>
        <p className="font-display text-h2 text-kore-ink mt-xs">{value}</p>
      </div>
    </div>
  );
}

export function ToolsOverviewPage() {
  const { data: toolsData, isLoading } = useTools();
  const { data: stats } = useToolStats();
  const { data: storesData } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const { data: storeToolsData } = useStoreTools(selectedStore || undefined);
  const toggleMutation = useToggleToolAssignment();

  const stores = storesData || [];

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  if (isLoading) {
    return <p className="text-kore-mid font-body">{t.common.loading}</p>;
  }

  // Tool-IDs die der ausgewählte Store hat (aus useStoreTools)
  const assignedToolIds = new Set<string>(
    (storeToolsData?.tools || [])
      .filter((t) => t.assigned)
      .map((t) => t.id)
  );

  const handleToggle = (toolId: string, isActive: boolean) => {
    if (!selectedStore) return;
    toggleMutation.mutate({
      toolId,
      storeId: selectedStore,
      action: isActive ? 'unassign' : 'assign',
    });
  };

  return (
    <div>
      <h1 className="font-display text-h2 sm:text-h1 text-kore-ink mb-lg sm:mb-xl">Tool-Buchung</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg mb-2xl">
        <StatsCard icon={Wrench} label={t.tools.totalTools} value={stats?.totalTools ?? 0} />
        <StatsCard icon={BarChart3} label={t.tools.totalAssignments} value={stats?.totalAssignments ?? 0} color="rgba(107, 140, 107, 0.1)" />
        <StatsCard icon={Euro} label={t.tools.mrr} value={formatPrice(stats?.mrr ?? 0)} color="rgba(158, 132, 96, 0.15)" />
      </div>

      {/* Store-Auswahl */}
      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <label className="font-body text-caption text-kore-mid uppercase tracking-[0.14em] block mb-md">
          Store auswählen
        </label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full max-w-[400px] px-md py-md-sm border border-kore-border bg-kore-white font-body text-body text-kore-ink"
        >
          <option value="">— Bitte Store wählen —</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name} ({store.city || 'Unbekannt'})
            </option>
          ))}
        </select>
      </div>

      {/* Tool-Liste mit Toggles */}
      <div className="flex flex-col gap-xl">
        {CATEGORY_ORDER.map((catKey) => {
          const catInfo = TOOL_CATEGORIES[catKey];
          const catTools = toolsData?.grouped[catKey] ?? [];
          if (!catInfo || catTools.length === 0) return null;

          return (
            <div key={catKey} className="bg-kore-white border border-kore-border">
              <div className="px-md sm:px-xl py-lg border-b border-kore-border">
                <h2 className="font-display text-h3 text-kore-ink">{catInfo.label}</h2>
                <p className="font-body text-small text-kore-mid mt-xs">{catInfo.description}</p>
              </div>
              <div className="divide-y divide-kore-border">
                {catTools.map((tool) => {
                  const isActive = assignedToolIds.has(tool.id);

                  return (
                    <div
                      key={tool.id}
                      className="px-md sm:px-xl py-md flex items-center justify-between gap-md"
                    >
                      <div className="min-w-0">
                        <p className="font-body text-body text-kore-ink font-normal">{tool.name}</p>
                        <p className="font-body text-small text-kore-mid truncate">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-md flex-shrink-0">
                        <span className="font-body text-small text-kore-ink whitespace-nowrap">
                          {formatPrice(tool.priceMonthly)}
                        </span>
                        <Badge variant="brass">
                          {tool._count.assignments} Stores
                        </Badge>
                        {selectedStore ? (
                          <button
                            onClick={() => handleToggle(tool.id, isActive)}
                            disabled={toggleMutation.isPending}
                            className={`relative inline-flex h-[24px] w-[44px] items-center rounded-full transition-colors ${
                              isActive ? 'bg-kore-olive' : 'bg-kore-border'
                            }`}
                          >
                            <span
                              className={`inline-block h-[18px] w-[18px] rounded-full bg-kore-white transition-transform ${
                                isActive ? 'translate-x-[22px]' : 'translate-x-[3px]'
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="font-body text-[0.65rem] text-kore-mid">
                            Store wählen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
