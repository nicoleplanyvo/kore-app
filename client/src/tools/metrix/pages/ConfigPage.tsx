import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import {
  useMetrixStores,
  useMetrixConfig,
  useCreateMetrixConfig,
  useUpdateMetrixConfig,
} from '../../../hooks/useMetrix';

interface KpiRow {
  id?: string;
  name: string;
  unit: string;
  weight: number;
  targetValue: number;
  minValue: number;
  maxValue: number | null;
  sortOrder: number;
  color: string;
}

const COLORS = ['#9E8460', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

function emptyKpi(index: number): KpiRow {
  return { name: '', unit: '%', weight: 0, targetValue: 100, minValue: 0, maxValue: null, sortOrder: index, color: COLORS[index % COLORS.length]! };
}

export function ConfigPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: stores } = useMetrixStores();
  const { data: existingConfig } = useMetrixConfig(id);

  const [storeId, setStoreId] = useState('');
  const [name, setName] = useState('Standard Scorecard');
  const [kpis, setKpis] = useState<KpiRow[]>([emptyKpi(0), emptyKpi(1), emptyKpi(2)]);

  const createConfig = useCreateMetrixConfig();
  const updateConfig = useUpdateMetrixConfig();

  useEffect(() => {
    if (existingConfig) {
      setStoreId(existingConfig.store?.id || '');
      setName(existingConfig.name);
      setKpis(existingConfig.kpis.map((k: any, i: number) => ({
        id: k.id, name: k.name, unit: k.unit, weight: k.weight, targetValue: k.targetValue,
        minValue: k.minValue, maxValue: k.maxValue, sortOrder: k.sortOrder ?? i, color: k.color || COLORS[i % COLORS.length],
      })));
    }
  }, [existingConfig]);

  useEffect(() => {
    if (!storeId && stores?.length) setStoreId(stores[0].id);
  }, [stores, storeId]);

  const totalWeight = kpis.reduce((s, k) => s + (k.weight || 0), 0);
  const isValid = name.trim() && kpis.length >= 1 && kpis.every(k => k.name.trim()) && Math.abs(totalWeight - 100) < 0.01;

  function addKpi() {
    if (kpis.length >= 10) return;
    setKpis([...kpis, emptyKpi(kpis.length)]);
  }

  function removeKpi(index: number) {
    if (kpis.length <= 1) return;
    setKpis(kpis.filter((_, i) => i !== index));
  }

  function updateKpi(index: number, field: keyof KpiRow, value: any) {
    setKpis(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k));
  }

  function distributeEvenly() {
    const w = Math.round((100 / kpis.length) * 10) / 10;
    const remainder = 100 - w * (kpis.length - 1);
    setKpis(prev => prev.map((k, i) => ({ ...k, weight: i === 0 ? Math.round(remainder * 10) / 10 : w })));
  }

  function handleSave() {
    const payload = { storeId, name, kpis: kpis.map((k, i) => ({ ...k, sortOrder: i })) };
    if (id) {
      updateConfig.mutate({ id, ...payload }, { onSuccess: () => navigate('..') });
    } else {
      createConfig.mutate(payload, { onSuccess: () => navigate('..') });
    }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate('..')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: '#9E8460', cursor: 'pointer', fontFamily: 'Jost, sans-serif', marginBottom: '1rem' }}>
        <ArrowLeft size={18} /> Zurück
      </button>

      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', margin: '0 0 1.5rem' }}>
        {id ? 'Scorecard bearbeiten' : 'Neue Scorecard'}
      </h1>

      {/* Basic Info */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
          </div>
          {!id && (
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Store</label>
              <select value={storeId} onChange={e => setStoreId(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', margin: 0 }}>
            KPIs ({kpis.length}/10)
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={distributeEvenly} style={{ padding: '0.375rem 0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.8125rem' }}>
              Gleichmaessig verteilen
            </button>
            <button onClick={addKpi} disabled={kpis.length >= 10} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#9E8460', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: '0.8125rem', opacity: kpis.length >= 10 ? 0.5 : 1 }}>
              <Plus size={14} /> KPI
            </button>
          </div>
        </div>

        {/* Weight bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: '1rem', background: '#f3f4f6' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ width: `${k.weight}%`, background: k.color, transition: 'width 0.3s' }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.875rem', fontWeight: 500 }}>
            Gesamt: {Math.round(totalWeight * 10) / 10}%
          </span>
          {Math.abs(totalWeight - 100) > 0.01 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.8125rem' }}>
              <AlertCircle size={14} /> Muss 100% ergeben
            </span>
          )}
        </div>

        {/* KPI rows */}
        {kpis.map((kpi, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', borderRadius: 8, background: i % 2 === 0 ? '#fafafa' : '#fff', marginBottom: '0.5rem' }}>
            <GripVertical size={16} color="#9ca3af" style={{ marginTop: 8 }} />
            <div style={{ width: 4, height: '100%', minHeight: 36, borderRadius: 2, background: kpi.color, alignSelf: 'stretch' }} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '0.5rem', alignItems: 'center' }}>
              <input
                placeholder="KPI Name"
                value={kpi.name}
                onChange={e => updateKpi(i, 'name', e.target.value)}
                style={{ padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
              <input
                type="number"
                step="any"
                placeholder="Gewicht"
                value={kpi.weight || ''}
                onChange={e => updateKpi(i, 'weight', parseFloat(e.target.value) || 0)}
                style={{ padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, textAlign: 'right' }}
              />
              <input
                type="number"
                step="any"
                placeholder="Ziel"
                value={kpi.targetValue || ''}
                onChange={e => updateKpi(i, 'targetValue', parseFloat(e.target.value) || 0)}
                style={{ padding: '0.375rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, textAlign: 'right' }}
              />
              <select
                value={kpi.unit}
                onChange={e => updateKpi(i, 'unit', e.target.value)}
                style={{ padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: 6 }}
              >
                <option value="%">%</option>
                <option value="EUR">EUR</option>
                <option value="Stk">Stk</option>
                <option value="Score">Score</option>
                <option value="Min">Min</option>
              </select>
            </div>
            <button
              onClick={() => removeKpi(i)}
              disabled={kpis.length <= 1}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: kpis.length <= 1 ? '#d1d5db' : '#ef4444', marginTop: 4 }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* Save */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleSave}
            disabled={!isValid || createConfig.isPending || updateConfig.isPending}
            style={{ padding: '0.625rem 2rem', background: isValid ? '#9E8460' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 6, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
          >
            {(createConfig.isPending || updateConfig.isPending) ? 'Wird gespeichert...' : id ? 'Speichern' : 'Scorecard erstellen'}
          </button>
          <button
            onClick={() => navigate('..')}
            style={{ padding: '0.625rem 1.5rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
