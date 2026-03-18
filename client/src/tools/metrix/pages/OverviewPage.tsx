import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Plus, ChevronRight, AlertCircle } from 'lucide-react';
import {
  useMetrixStores,
  useMetrixConfigs,
  useMetrixEntries,
  useSubmitMetrixEntry,
} from '../../../hooks/useMetrix';

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ampelColor(score: number | null): string {
  if (score == null) return '#9ca3af';
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#eab308';
  return '#ef4444';
}

export function OverviewPage() {
  const navigate = useNavigate();
  const { data: stores } = useMetrixStores();
  const [storeId, setStoreId] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const [scores, setScores] = useState<Record<string, string>>({});

  const activeStoreId = storeId || stores?.[0]?.id || '';
  const { data: configs } = useMetrixConfigs(activeStoreId);
  const activeConfigId = selectedConfig || configs?.[0]?.id || '';
  const { data: entries } = useMetrixEntries(activeConfigId);
  const submitEntry = useSubmitMetrixEntry();

  const activeConfig = configs?.find((c: any) => c.id === activeConfigId);
  const currentEntry = entries?.find((e: any) => e.period === period);

  function handleSubmit() {
    if (!activeConfig) return;
    const scoreData = activeConfig.kpis.map((kpi: any) => ({
      kpiId: kpi.id,
      actualValue: parseFloat(scores[kpi.id] || '0'),
    }));
    submitEntry.mutate({ configId: activeConfigId, period, scores: scoreData });
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Gauge size={28} color="#9E8460" />
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', margin: 0 }}>
          Metrix
        </h1>
      </div>

      {/* Store + Config Selector */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select
          value={activeStoreId}
          onChange={e => { setStoreId(e.target.value); setSelectedConfig(''); }}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', flex: 1, minWidth: 200 }}
        >
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={activeConfigId}
          onChange={e => setSelectedConfig(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', flex: 1, minWidth: 200 }}
        >
          {configs?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button
          onClick={() => navigate('config')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#9E8460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}
        >
          <Plus size={16} /> Neue Scorecard
        </button>
      </div>

      {/* Current Overall Score */}
      {currentEntry && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', color: '#6b7280', margin: '0 0 0.5rem' }}>Gesamtergebnis {period}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `4px solid ${ampelColor(currentEntry.overallScore)}`, fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.5rem', fontWeight: 700,
            }}>
              {currentEntry.overallScore}%
            </div>
          </div>
        </div>
      )}

      {/* KPI Entry Form */}
      {activeConfig && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: 0 }}>
              Werte erfassen
            </h2>
            <input
              type="month"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeConfig.kpis.map((kpi: any) => (
              <div key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: kpi.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', fontWeight: 500 }}>
                    {kpi.name} <span style={{ color: '#9ca3af' }}>({kpi.weight}%)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Ziel: {kpi.targetValue} {kpi.unit}</div>
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder={`${kpi.targetValue}`}
                  value={scores[kpi.id] ?? currentEntry?.scores?.find((s: any) => s.kpiId === kpi.id)?.actualValue ?? ''}
                  onChange={e => setScores(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                  style={{ width: 100, padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, textAlign: 'right' }}
                />
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', color: '#6b7280', width: 30 }}>{kpi.unit}</span>
              </div>
            ))}
          </div>

          {Math.abs(activeConfig.kpis.reduce((s: number, k: any) => s + k.weight, 0) - 100) > 0.01 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.75rem' }}>
              <AlertCircle size={16} /> Gewichtung ergibt nicht 100%
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitEntry.isPending}
            style={{ marginTop: '1rem', padding: '0.625rem 1.5rem', background: '#9E8460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 500, opacity: submitEntry.isPending ? 0.6 : 1 }}
          >
            {submitEntry.isPending ? 'Wird gespeichert...' : currentEntry ? 'Aktualisieren' : 'Speichern'}
          </button>
        </div>
      )}

      {/* History */}
      {entries && entries.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: '0 0 1rem' }}>Verlauf</h2>
          {entries.map((entry: any) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}>{entry.period}</span>
                {entry.notes && <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{entry.notes}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: '1.125rem', fontWeight: 700,
                  color: ampelColor(entry.overallScore),
                }}>
                  {entry.overallScore}%
                </span>
                <ChevronRight size={16} color="#9ca3af" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!configs?.length && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Gauge size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: 'Jost, sans-serif' }}>Noch keine Scorecard konfiguriert.</p>
          <button
            onClick={() => navigate('config')}
            style={{ padding: '0.5rem 1rem', background: '#9E8460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}
          >
            Erste Scorecard erstellen
          </button>
        </div>
      )}
    </div>
  );
}
