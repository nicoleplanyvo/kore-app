import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  type: 'INVOICE' | 'QUOTE';
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ACCEPTED' | 'CANCELED';
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
  items: InvoiceItem[];
  tenant: { id?: string; name: string; contactName?: string | null; contactEmail?: string | null };
}

interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

interface BillingStats {
  openQuotes: number;
  openInvoices: number;
  overdueAmount: number;
  mrr: number;
}

interface ListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  tenantId?: string;
}

export function useInvoices(params: ListParams = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.tenantId) qs.set('tenantId', params.tenantId);

  return useQuery({
    queryKey: ['billing', 'invoices', params],
    queryFn: () => api<InvoiceListResponse>(`/api/admin/billing?${qs.toString()}`),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['billing', 'invoice', id],
    queryFn: () => api<Invoice>(`/api/admin/billing/${id}`),
    enabled: !!id,
  });
}

export function useBillingStats() {
  return useQuery({
    queryKey: ['billing', 'stats'],
    queryFn: () => api<BillingStats>('/api/admin/billing/stats'),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      type: 'INVOICE' | 'QUOTE';
      issueDate: string;
      dueDate?: string;
      notes?: string;
      items: { description: string; quantity: number; unitPrice: number }[];
    }) => api<Invoice>('/api/admin/billing', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<Invoice>(`/api/admin/billing/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useUpdateInvoiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api<Invoice>(`/api/admin/billing/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/billing/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<{ generated: number }>('/api/admin/billing/generate', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
