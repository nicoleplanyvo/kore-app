import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gueltige E-Mail-Adresse ein'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const auditSessionCreateSchema = z.object({
  storeId: z.string().min(1, 'Bitte waehle einen Store'),
  templateId: z.string().min(1, 'Bitte waehle ein Template'),
  storeLocation: z.string().optional(),
});

export type AuditSessionCreateInput = z.infer<typeof auditSessionCreateSchema>;
