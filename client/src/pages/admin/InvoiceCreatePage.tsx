import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useCreateInvoice } from '../../hooks/useBilling';
import { useTenants } from '../../hooks/useTenants';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 100 });

  const [type, setType] = useState<'INVOICE' | 'QUOTE'>('INVOICE');
  const [tenantId, setTenantId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = Math.round(subtotal * 0.19);
  const total = subtotal + taxAmount;

  const canSubmit = tenantId && issueDate && items.every((i) => i.description && i.quantity > 0 && i.unitPrice > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const result = await createMutation.mutateAsync({
        tenantId,
        type,
        issueDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      navigate(`/admin/buchhaltung/${result.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/admin/buchhaltung')}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </button>

      <h1 className="font-display text-h2 sm:text-h1 text-kore-ink mb-xl">
        {type === 'INVOICE' ? 'Rechnung' : 'Angebot'} erstellen
      </h1>

      <div className="space-y-lg">
        {/* Type & Tenant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <Select
              label="Typ"
              value={type}
              onChange={(e) => setType(e.target.value as 'INVOICE' | 'QUOTE')}
              options={[
                { value: 'INVOICE', label: 'Rechnung' },
                { value: 'QUOTE', label: 'Angebot' },
              ]}
            />
          </div>
          <div>
            <Select
              label="Kunde"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Kunde wählen..."
              options={tenantsData?.data.map((t) => ({ value: t.id, label: t.name })) || []}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className="font-body text-small text-kore-mid mb-xs block">Datum</label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="font-body text-small text-kore-mid mb-xs block">Zahlungsziel</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <label className="font-body text-small text-kore-mid mb-sm block">Positionen</label>
          <div className="space-y-sm">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-sm items-start bg-kore-white border border-kore-border p-md">
                <div className="flex-1">
                  <Input
                    placeholder="Beschreibung"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Menge"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Preis (Cent)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="w-28 pt-md text-right font-body text-small text-kore-ink">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="p-sm text-kore-mid hover:text-red-600 transition-colors mt-sm"
                  disabled={items.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-sm flex items-center gap-xs text-kore-brass hover:text-kore-ink font-body text-small transition-colors"
          >
            <Plus size={14} />
            Position hinzufügen
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-xs">
            <div className="flex justify-between font-body text-small text-kore-mid">
              <span>Netto</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-body text-small text-kore-mid">
              <span>USt 19%</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-body text-body text-kore-ink font-semibold border-t border-kore-border pt-sm">
              <span>Brutto</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="font-body text-small text-kore-mid mb-xs block">Hinweise</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionale Hinweise..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-md pt-md">
          <Button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending}>
            {createMutation.isPending ? 'Erstelle...' : 'Als Entwurf speichern'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/buchhaltung')}>
            Abbrechen
          </Button>
        </div>

        {createMutation.isError && (
          <p className="text-red-600 font-body text-small">
            Fehler: {(createMutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
