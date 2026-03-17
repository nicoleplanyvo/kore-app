import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Receipt, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { Button, Badge, Table, Thead, Tbody, Th, Tr, Td } from '@/components/ui';
import { useInvoices, useBillingStats, useGenerateInvoices, type Invoice } from '../../hooks/useBilling';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'brass'> = {
  DRAFT: 'brass',
  SENT: 'warning',
  PAID: 'success',
  OVERDUE: 'error',
  ACCEPTED: 'success',
  CANCELED: 'error',
};

const statusLabel: Record<string, string> = {
  DRAFT: 'Entwurf',
  SENT: 'Gesendet',
  PAID: 'Bezahlt',
  OVERDUE: 'Überfällig',
  ACCEPTED: 'Angenommen',
  CANCELED: 'Storniert',
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function BillingOverviewPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'QUOTE' | 'INVOICE'>('INVOICE');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: stats } = useBillingStats();
  const { data, isLoading } = useInvoices({
    page,
    pageSize: 20,
    type: tab,
    status: statusFilter || undefined,
  });

  const generateMutation = useGenerateInvoices();
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const kpiCards = [
    { label: 'Offene Angebote', value: stats?.openQuotes ?? 0, icon: FileText, color: 'text-kore-brass' },
    { label: 'Offene Rechnungen', value: stats?.openInvoices ?? 0, icon: Receipt, color: 'text-kore-brass' },
    { label: 'Überfällig', value: formatCurrency(stats?.overdueAmount ?? 0), icon: AlertTriangle, color: 'text-red-600' },
    { label: 'MRR', value: formatCurrency(stats?.mrr ?? 0), icon: TrendingUp, color: 'text-emerald-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-lg sm:mb-xl gap-md flex-wrap">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">Buchhaltung</h1>
        <div className="flex gap-sm">
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm('Monatliche Rechnungen für alle aktiven Kunden generieren?')) {
                generateMutation.mutate();
              }
            }}
            disabled={generateMutation.isPending}
          >
            <span className="flex items-center gap-sm">
              <Zap size={16} />
              <span className="hidden sm:inline">Auto-Rechnungen</span>
            </span>
          </Button>
          <Button onClick={() => navigate('/admin/buchhaltung/neu')}>
            <span className="flex items-center gap-sm">
              <Plus size={16} />
              <span className="hidden sm:inline">Erstellen</span>
            </span>
          </Button>
        </div>
      </div>

      {generateMutation.isSuccess && (
        <div className="mb-lg p-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-body text-small">
          {generateMutation.data.generated} Rechnungen wurden generiert.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-kore-white border border-kore-border p-md sm:p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <kpi.icon size={18} className={kpi.color} />
              <span className="font-body text-small text-kore-mid">{kpi.label}</span>
            </div>
            <p className="font-display text-h3 sm:text-h2 text-kore-ink">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-lg border-b border-kore-border">
        <button
          onClick={() => { setTab('INVOICE'); setPage(1); setStatusFilter(''); }}
          className={`px-lg py-md font-body text-small border-b-2 transition-colors ${
            tab === 'INVOICE' ? 'border-kore-brass text-kore-brass font-semibold' : 'border-transparent text-kore-mid hover:text-kore-ink'
          }`}
        >
          Rechnungen
        </button>
        <button
          onClick={() => { setTab('QUOTE'); setPage(1); setStatusFilter(''); }}
          className={`px-lg py-md font-body text-small border-b-2 transition-colors ${
            tab === 'QUOTE' ? 'border-kore-brass text-kore-brass font-semibold' : 'border-transparent text-kore-mid hover:text-kore-ink'
          }`}
        >
          Angebote
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-md mb-lg flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="font-body text-small bg-kore-white border border-kore-border px-md py-md-sm text-kore-ink outline-none cursor-pointer"
        >
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="SENT">Gesendet</option>
          {tab === 'INVOICE' && <option value="PAID">Bezahlt</option>}
          {tab === 'INVOICE' && <option value="OVERDUE">Überfällig</option>}
          {tab === 'QUOTE' && <option value="ACCEPTED">Angenommen</option>}
          {tab === 'QUOTE' && <option value="CANCELED">Storniert</option>}
        </select>
      </div>

      {/* Table */}
      <div className="bg-kore-white border border-kore-border overflow-x-auto">
        {isLoading ? (
          <p className="p-xl text-kore-mid font-body text-small">Laden...</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Nr.</Th>
                <Th>Kunde</Th>
                <Th>Datum</Th>
                <Th>Betrag</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {data?.invoices.map((inv: Invoice) => (
                <Tr key={inv.id} onClick={() => navigate(`/admin/buchhaltung/${inv.id}`)}>
                  <Td><span className="font-mono text-small">{inv.number}</span></Td>
                  <Td><span className="text-small">{inv.tenant.name}</span></Td>
                  <Td><span className="text-small">{formatDate(inv.issueDate)}</span></Td>
                  <Td><span className="text-small font-semibold">{formatCurrency(inv.total)}</span></Td>
                  <Td>
                    <Badge variant={statusVariant[inv.status]}>
                      {statusLabel[inv.status]}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              {data?.invoices.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--kore-mid)', fontFamily: "'Jost', sans-serif" }}>
                    Keine {tab === 'INVOICE' ? 'Rechnungen' : 'Angebote'} vorhanden.
                  </td>
                </tr>
              )}
            </Tbody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-lg">
          <p className="font-body text-small text-kore-mid">
            Seite {page} von {totalPages} ({data?.total} Einträge)
          </p>
          <div className="flex gap-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-md py-sm border border-kore-border bg-kore-white text-kore-ink font-body text-small disabled:opacity-40 disabled:cursor-not-allowed hover:border-kore-brass transition-colors"
            >
              Zurück
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-md py-sm border border-kore-border bg-kore-white text-kore-ink font-body text-small disabled:opacity-40 disabled:cursor-not-allowed hover:border-kore-brass transition-colors"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
