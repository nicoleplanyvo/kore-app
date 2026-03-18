import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useMetrixStores,
  useMetrixConfigs,
  useMetrixDashboard,
  useMetrixCompare,
} from '../../../hooks/useMetrix';

function ampelColor(score: number | null): string {
  if (score == null) return '#9ca3af';
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#eab308';
  return '#ef4444';
}

function ampelLabel(score: number | null): string {
  if (score == null) return 'Keine Daten';
  if (score >= 90) return 'Sehr gut';
  if (score >= 70) return 'Befriedigend';
  return 'Kritisch';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stores } = useMetrixStores();
  const [storeId, setStoreId] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  const activeStoreId = storeId || stores?.[0]?.id || '';
  const { data: configs } = useMetrixConfigs(activeStoreId);
  const activeConfigId = selectedConfig || configs?.[0]?.id || '';
  const { data: dashboard } = useMetrixDashboard(activeConfigId);
  const { data: compare } = useMetrixCompare();

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1060, margin: '0 auto' }}>
      <button onClick={() => navigate('..')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: '#9E8460', cursor: 'pointer', fontFamily: 'Jost, sans-serif', marginBottom: '1rem' }}>
        <ArrowLeft size={18} /> Zurueck
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <BarChart3 size={28} color="#9E8460" />
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', margin: 0 }}>Metrix Dashboard</h1>
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={activeStoreId} onChange={e => { setStoreId(e.target.value); setSelectedConfig(''); }} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 200 }}>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={activeConfigId} onChange={e => setSelectedConfig(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 200 }}>
          {configs?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowCompare(!showCompare)} style={{ padding: '0.5rem 1rem', background: showCompare ? '#9E8460' : '#f3f4f6', color: showCompare ? '#fff' : '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}>
          Store-Vergleich
        </button>
      </div>

      {dashboard && !showCompare && (
        <>
          {/* Overall Score Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Gesamtergebnis</p>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 0.5rem',
                border: `4px solid ${ampelColor(dashboard.currentOverall)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.375rem', fontWeight: 700,
              }}>
                {dashboard.currentOverall != null ? `${dashboard.currentOverall}%` : '--'}
              </div>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.8125rem', color: ampelColor(dashboard.currentOverall), fontWeight: 600 }}>
                {ampelLabel(dashboard.currentOverall)}
              </span>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Vorperiode</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                {dashboard.previousOverall != null ? `${dashboard.previousOverall}%` : '--'}
              </p>
              {dashboard.change != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: dashboard.change > 0 ? '#22c55e' : dashboard.change < 0 ? '#ef4444' : '#6b7280' }}>
                  {dashboard.change > 0 ? <TrendingUp size={14} /> : dashboard.change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {dashboard.change > 0 ? '+' : ''}{dashboard.change} Pkt.
                </span>
              )}
            </div>

            {dashboard.bestKpi && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Jost, sans-serif', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Bester KPI</p>
                <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600, margin: '0 0 0.25rem' }}>{dashboard.bestKpi.name}</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, color: '#22c55e', margin: 0 }}>
                  {dashboard.bestKpi.achievement}%
                </p>
              </div>
            )}

            {dashboard.worstKpi && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Jost, sans-serif', color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Schwachpunkt</p>
                <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600, margin: '0 0 0.25rem' }}>{dashboard.worstKpi.name}</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                  {dashboard.worstKpi.achievement}%
                </p>
              </div>
            )}
          </div>

          {/* KPI Breakdown */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: '0 0 1rem' }}>KPI-Aufschluesselung</h2>
            {dashboard.kpiBreakdown.map((kpi: any) => (
              <div key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: kpi.color }} />
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', fontWeight: 500 }}>{kpi.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{kpi.weight}% Gewichtung</div>
                </div>
                <div style={{ width: 80, textAlign: 'right', fontFamily: 'Jost, sans-serif', fontSize: '0.875rem' }}>
                  {kpi.actualValue != null ? `${kpi.actualValue} ${kpi.unit}` : '--'}
                </div>
                <div style={{ width: 60, textAlign: 'right', fontFamily: 'Jost, sans-serif', fontSize: '0.75rem', color: '#6b7280' }}>
                  Ziel: {kpi.targetValue}
                </div>
                {/* Achievement bar */}
                <div style={{ width: 120 }}>
                  <div style={{ height: 8, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(kpi.achievement ?? 0, 100)}%`, background: ampelColor(kpi.achievement), borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ width: 50, textAlign: 'right', fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: ampelColor(kpi.achievement) }}>
                  {kpi.achievement != null ? `${kpi.achievement}%` : '--'}
                </div>
              </div>
            ))}
          </div>

          {/* Trend */}
          {dashboard.trend.length > 1 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: '0 0 1rem' }}>Trend</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160 }}>
                {dashboard.trend.map((t: any) => {
                  const max = Math.max(...dashboard.trend.map((x: any) => x.overallScore), 100);
                  const h = max > 0 ? (t.overallScore / max) * 140 : 0;
                  return (
                    <div key={t.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', fontFamily: 'Jost, sans-serif', color: ampelColor(t.overallScore), fontWeight: 600, marginBottom: '0.25rem' }}>
                        {t.overallScore}%
                      </span>
                      <div style={{ width: '100%', maxWidth: 40, height: h, borderRadius: '4px 4px 0 0', background: ampelColor(t.overallScore), transition: 'height 0.3s' }} />
                      <span style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.25rem', fontFamily: 'Jost, sans-serif' }}>
                        {t.period.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Store Comparison */}
      {showCompare && compare && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: '0 0 1rem' }}>Store-Vergleich ({compare.period})</h2>
          {compare.stores.length === 0 && (
            <p style={{ color: '#6b7280', fontFamily: 'Jost, sans-serif' }}>Keine Daten verfuegbar.</p>
          )}
          {compare.stores.map((s: any, i: number) => (
            <div key={`${s.storeId}-${s.configId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '1.125rem', width: 28, color: i < 3 ? '#9E8460' : '#9ca3af' }}>
                #{i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}>{s.storeName}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.configName}</div>
              </div>
              <div style={{ width: 160 }}>
                <div style={{ height: 8, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(s.overallScore ?? 0, 100)}%`, background: ampelColor(s.overallScore), borderRadius: 4 }} />
                </div>
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '1.125rem', color: ampelColor(s.overallScore), width: 60, textAlign: 'right' }}>
                {s.overallScore != null ? `${s.overallScore}%` : '--'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
