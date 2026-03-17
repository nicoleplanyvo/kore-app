import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ────────────────────────────────────────────

interface MsStore {
  id: string;
  name: string;
  city: string | null;
}

interface MsUser {
  id: string;
  name: string;
  role: string;
}

interface MsTask {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: 'TODO' | 'CHECKLIST' | 'CAMPAIGN' | 'SURVEY';
  category: string;
  tags: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'REJECTED';
  storeIds: string[];
  deadline: string | null;
  requiresPhoto: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  checklistItems: string[];
  campaignName: string | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  surveyQuestions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SCALE' | 'FREE_TEXT' | 'PHOTO';
  question: string;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

interface MsTaskResponse {
  id: string;
  taskId: string;
  storeId: string;
  storeName: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  completedBy: string | null;
  completedByName: string | null;
  completedAt: string | null;
  photoUrl: string | null;
  feedback: string | null;
  rejectionReason: string | null;
  checklistProgress: Record<string, boolean>;
  surveyAnswers: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface MsComment {
  id: string;
  taskId: string;
  storeId: string | null;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface MsTaskDetail extends MsTask {
  responses: MsTaskResponse[];
  comments: MsComment[];
  complianceRate: number;
}

interface MsTaskListResponse {
  data: MsTask[];
  total: number;
  page: number;
  pageSize: number;
}

interface MsDashboard {
  kpis: {
    totalTasks: number;
    openTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
    complianceRate: number;
    avgResponseTimeHours: number;
  };
  storeCompliance: { storeId: string; storeName: string; total: number; completed: number; rate: number }[];
  problemStores: { storeId: string; storeName: string; total: number; completed: number; rate: number }[];
  trends: { week: string; created: number; completed: number }[];
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

interface MsOverviewEntry {
  storeId: string;
  storeName: string;
  city: string | null;
  kpi: { revenue: number; transactions: number; footfall: number; unitsSold: number; date: string } | null;
  footfall7d: { totalFootfall: number; totalRevenue: number; totalTransactions: number };
  openMaintenance: number;
  taskCompliance: number;
  openTasks: number;
}

interface TaskFilters {
  storeId?: string;
  type?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ── Hooks ────────────────────────────────────────────

export function useMultiStoreStores() {
  return useQuery<MsStore[]>({
    queryKey: ['multi-store', 'stores'],
    queryFn: () => api<MsStore[]>('/api/tools/multi-store/stores'),
  });
}

export function useMultiStoreUsers() {
  return useQuery<MsUser[]>({
    queryKey: ['multi-store', 'users'],
    queryFn: () => api<MsUser[]>('/api/tools/multi-store/users'),
  });
}

export function useMultiStoreTasks(filters: TaskFilters = {}) {
  return useQuery<MsTaskListResponse>({
    queryKey: ['multi-store', 'tasks', filters],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (filters.storeId) sp.set('storeId', filters.storeId);
      if (filters.type) sp.set('type', filters.type);
      if (filters.status) sp.set('status', filters.status);
      if (filters.priority) sp.set('priority', filters.priority);
      if (filters.category) sp.set('category', filters.category);
      if (filters.search) sp.set('search', filters.search);
      if (filters.page) sp.set('page', String(filters.page));
      if (filters.pageSize) sp.set('pageSize', String(filters.pageSize));
      return api<MsTaskListResponse>(`/api/tools/multi-store/tasks?${sp}`);
    },
  });
}

export function useMultiStoreTask(id?: string) {
  return useQuery<MsTaskDetail>({
    queryKey: ['multi-store', 'task', id],
    queryFn: () => api<MsTaskDetail>(`/api/tools/multi-store/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateMultiStoreTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      type?: string;
      category?: string;
      tags?: string[];
      priority?: string;
      storeIds: string[];
      deadline?: string;
      requiresPhoto?: boolean;
      checklistItems?: string[];
      campaignName?: string;
      campaignStart?: string;
      campaignEnd?: string;
      surveyQuestions?: SurveyQuestion[];
    }) =>
      api<MsTask>('/api/tools/multi-store/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-store'] });
    },
  });
}

export function useUpdateMultiStoreTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api<MsTask>(`/api/tools/multi-store/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-store'] });
    },
  });
}

export function useDeleteMultiStoreTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean }>(`/api/tools/multi-store/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-store'] });
    },
  });
}

export function useUpdateMultiStoreResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, storeId, ...data }: { taskId: string; storeId: string; [key: string]: any }) =>
      api<MsTaskResponse>(`/api/tools/multi-store/tasks/${taskId}/responses/${storeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-store'] });
    },
  });
}

export function useMultiStoreComments(taskId?: string) {
  return useQuery<MsComment[]>({
    queryKey: ['multi-store', 'comments', taskId],
    queryFn: () => api<MsComment[]>(`/api/tools/multi-store/tasks/${taskId}/comments`),
    enabled: !!taskId,
  });
}

export function useAddMultiStoreComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }: { taskId: string; message: string; storeId?: string }) =>
      api<MsComment>(`/api/tools/multi-store/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-store'] });
    },
  });
}

export function useMultiStoreDashboard() {
  return useQuery<MsDashboard>({
    queryKey: ['multi-store', 'dashboard'],
    queryFn: () => api<MsDashboard>('/api/tools/multi-store/dashboard'),
  });
}

export function useMultiStoreOverview() {
  return useQuery<MsOverviewEntry[]>({
    queryKey: ['multi-store', 'overview'],
    queryFn: () => api<MsOverviewEntry[]>('/api/tools/multi-store/overview'),
  });
}

export function useMultiStoreComparison(params?: { period?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  return useQuery<any[]>({
    queryKey: ['multi-store', 'comparison', params],
    queryFn: () => api<any[]>(`/api/tools/multi-store/comparison?${sp}`),
  });
}

export function useMultiStoreRanking(params?: { metric?: string }) {
  const sp = new URLSearchParams();
  if (params?.metric) sp.set('metric', params.metric);
  return useQuery<any[]>({
    queryKey: ['multi-store', 'ranking', params],
    queryFn: () => api<any[]>(`/api/tools/multi-store/ranking?${sp}`),
  });
}
