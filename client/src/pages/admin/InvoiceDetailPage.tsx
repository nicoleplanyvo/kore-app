import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button, Badge, Table, Thead, Tbody, Th, Tr, Td } from '@/components/ui';
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from '../../hooks/useBilling';
import { API_URL, getAccessToken } from '../../lib/api';

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

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const statusMutation = useUpdateInvoiceStatus(id || '');
  const deleteMutation = useDeleteInvoice();

  if (isLoading) {
    return <p className="text-kore-mid font-body text-small">Laden...</p>;
  }

  if (!invoice) {
    return <p className="text-kore-mid font-body text-small">Nicht gefunden.</p>;
  }

  const typeLabel = invoice.type === 'INVOICE' ? 'Rechnung' : 'Angebot';

  const handleDownloadPdf = () => {
    const token = getAccessToken();
    const url = `${API_URL}/api/admin/billing/${id}/pdf`;
    const a = document.createElement('a');
    a.href = url;
    // For authenticated download, open in new tab (cookie auth)
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          a.href = blobUrl;
          a.download = `${typeLabel}_${invoice.number}.pdf`;
          a.click();
          URL.revokeObjectURL(blobUrl);
        });
    }
  };

  const handleStatusChange = (status: string) => {
    statusMutation.mutate(status);
  };

  const handleDelete = () => {
    if (confirm(`${typeLabel} ${invoice.number} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      deleteMutation.mutate(id!, {
        onSuccess: () => navigate('/admin/buchhaltung'),
      });
    }
  };

  // Determine available status actions
  const actions: { label: string; status: string; icon: typeof Send; variant?: 'secondary' }[] = [];
  if (invoice.status === 'DRAFT') {
    actions.push({ label: 'Senden', status: 'SENT', icon: Send });
  }
  if (invoice.status === 'SENT' && invoice.type === 'INVOICE') {
    actions.push({ label: 'Als bezahlt', status: 'PAID', icon: CheckCircle });
    actions.push({ label: 'Überfällig', status: 'OVERDUE', icon: AlertTriangle, variant: 'secondary' });
  }
  if (invoice.status === 'SENT' && invoice.type === 'QUOTE') {
    actions.push({ label: 'Angenommen', status: 'ACCEPTED', icon: CheckCircle });
    actions.push({ label: 'Stornieren', status: 'CANCELED', icon: XCircle, variant: 'secondary' });
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/admin/buchhaltung')}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-xl gap-md flex-wrap">
        <div>
          <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">
            {typeLabel} {invoice.number}
          </h1>
          <p className="font-body text-small text-kore-mid mt-xs">
            {invoice.tenant.name}
            {invoice.tenant.contactName && ` — ${invoice.tenant.contactName}`}
          </p>
        </div>
        <Badge variant={statusVariant[invoice.status]}>
          {statusLabel[invoice.status]}
        </Badge>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
        <div>
          <p className="font-body text-small text-kore-mid">Datum</p>
          <p className="font-body text-body text-kore-ink">{formatDate(invoice.issueDate)}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <p className="font-body text-small text-kore-mid">Zahlungsziel</p>
            <p className="font-body text-body text-kore-ink">{formatDate(invoice.dueDate)}</p>
          </div>
        )}
        {invoice.sentAt && (
          <div>
            <p className="font-body text-small text-kore-mid">Gesendet am</p>
            <p className="font-body text-body text-kore-ink">{formatDate(invoice.sentAt)}</p>
          </div>
        )}
        {invoice.paidAt && (
          <div>
            <p className="font-body text-small text-kore-mid">Bezahlt am</p>
            <p className="font-body text-body text-kore-ink">{formatDate(invoice.paidAt)}</p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-kore-white border border-kore-border overflow-x-auto mb-lg">
        <Table>
          <Thead>
            <tr>
              <Th>Pos</Th>
              <Th>Beschreibung</Th>
              <Th style={{ textAlign: 'center' }}>Menge</Th>
              <Th style={{ textAlign: 'right' }}>Einzelpreis</Th>
              <Th style={{ textAlign: 'right' }}>Gesamt</Th>
            </tr>
          </Thead>
          <Tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--kore-border)' }}>
                <Td><span className="text-small text-kore-mid">{idx + 1}</span></Td>
                <Td><span className="text-small">{item.description}</span></Td>
                <Td style={{ textAlign: 'center' }}><span className="text-small">{item.quantity}</span></Td>
                <Td style={{ textAlign: 'right' }}><span className="text-small">{formatCurrency(item.unitPrice)}</span></Td>
                <Td style={{ textAlign: 'right' }}><span className="text-small font-semibold">{formatCurrency(item.total)}</span></Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-xl">
        <div className="w-64 space-y-xs">
          <div className="flex justify-between font-body text-small text-kore-mid">
            <span>Netto</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between font-body text-small text-kore-mid">
            <span>USt {Math.round(invoice.taxRate * 100)}%</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-body text-body text-kore-ink font-semibold border-t border-kore-border pt-sm">
            <span>Brutto</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-xl p-md bg-kore-bg border border-kore-border">
          <p className="font-body text-small text-kore-mid mb-xs">Hinweise</p>
          <p className="font-body text-small text-kore-ink whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-sm flex-wrap">
        <Button variant="secondary" onClick={handleDownloadPdf}>
          <span className="flex items-center gap-sm">
            <Download size={16} />
            PDF herunterladen
          </span>
        </Button>

        {actions.map((action) => (
          <Button
            key={action.status}
            variant={action.variant || undefined}
            onClick={() => handleStatusChange(action.status)}
            disabled={statusMutation.isPending}
          >
            <span className="flex items-center gap-sm">
              <action.icon size={16} />
              {action.label}
            </span>
          </Button>
        ))}

        {invoice.status === 'DRAFT' && (
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <span className="flex items-center gap-sm text-red-600">
              <XCircle size={16} />
              Löschen
            </span>
          </Button>
        )}
      </div>

      {statusMutation.isError && (
        <p className="mt-md text-red-600 font-body text-small">
          Fehler: {(statusMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
