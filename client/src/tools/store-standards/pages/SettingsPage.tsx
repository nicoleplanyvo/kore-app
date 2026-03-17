import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Coins, Clock, Award } from 'lucide-react';
import { useBudgetStore } from '../../../stores/budgetStore';

export function SettingsPage() {
  const { state, setSettings } = useBudgetStore();
  const s = state.settings;

  const field = (label: string, key: keyof typeof s, step = '1', suffix = '') => (
    <div>
      <label className="block text-small text-kore-mid mb-xs">{label}</label>
      <div className="flex items-center gap-xs">
        <input
          type="number"
          step={step}
          value={s[key] as number}
          onChange={(e) => setSettings({ [key]: Number(e.target.value) })}
          className="w-full border border-kore-border px-md py-sm text-body text-right"
        />
        {suffix && <span className="text-small text-kore-mid whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>
      <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm mb-xs">
        <Settings size={24} /> Einstellungen
      </h1>
      <p className="text-body text-kore-mid mb-2xl">Grundparameter fuer die Budget-Berechnung.</p>

      {/* Waehrung & Kosten */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Coins size={18} /> Waehrung & Kosten</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Waehrungssymbol</label>
            <input
              type="text"
              value={s.currency}
              onChange={(e) => setSettings({ currency: e.target.value })}
              className="w-full border border-kore-border px-md py-sm text-body"
              maxLength={3}
            />
          </div>
          {field('Wechselkurs', 'fxRate', '0.01')}
          {field('Arbeitgeber-Aufschlag', 'employerPremiumPct', '0.1', '%')}
          {field('Urlaubsgeld', 'holidayPayPct', '0.1', '%')}
        </div>
      </div>

      {/* Zeit */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Clock size={18} /> Zeit</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {field('Wochen pro Jahr', 'weeksPerYear', '1')}
          {field('Sonntage (Management)', 'sundaysManagement', '1')}
          {field('Feiertage', 'publicHolidays', '1')}
        </div>
      </div>

      {/* Zuschlaege */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Award size={18} /> Zuschlaege</h2>
      <div className="bg-kore-white border border-kore-border p-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {field('Sonntagszuschlag', 'sundayPremiumPct', '1', '%')}
          {field('Stunden pro Sonntag', 'hoursPerSunday', '0.5', 'h')}
          {field('Feiertagsbesetzung', 'holidayStaffingPct', '1', '%')}
          {field('Stunden pro Feiertag', 'hoursPerHoliday', '0.5', 'h')}
        </div>
      </div>
    </div>
  );
}
