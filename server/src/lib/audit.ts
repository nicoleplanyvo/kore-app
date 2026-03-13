import prisma from './prisma.js';

interface AuditInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: input.details ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Audit-Log-Fehler sollen die Hauptoperation nicht blockieren
    console.error('Audit log error:', err);
  }
}
