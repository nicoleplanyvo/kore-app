import path from 'path';
import fs from 'fs/promises';
import prisma from './prisma.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Foto-Retention (DSGVO-Datenminimierung, DSFA-Maßnahme R4).
 *
 * Store-Fotos können zufällig Personen abbilden. Nach Ablauf der Aufbewahrungsfrist
 * wird die BILDDATEI gelöscht und der Pfad auf null gesetzt — der nicht
 * personenbezogene Datensatz (Status, Zeitstempel, Store-Ebenen-Kennzahlen) bleibt
 * als Audit-Spur erhalten.
 *
 * Frist über RETENTION_DAYS (Default 90).
 */

const RETENTION_DAYS = Number(process.env['RETENTION_DAYS'] ?? 90);
const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? path.join(process.cwd(), 'uploads');

/**
 * Modelle mit Store-Fotos: Pfadfeld + Datumsfeld für die Altersprüfung.
 * `nullable`: true → Pfad wird auf null gesetzt; false (Pflichtfeld, z. B. VmSubmission)
 * → Pfad wird auf '' gesetzt (Datei gelöscht, Datensatz bleibt als Audit-Spur).
 */
const TARGETS: Array<{ model: string; pathField: string; dateField: string; label: string; nullable: boolean }> = [
  { model: 'photoRequestTarget', pathField: 'photoPath', dateField: 'submittedAt', label: 'Spot-Check-Einreichungen', nullable: true },
  { model: 'photoRequest', pathField: 'referencePhoto', dateField: 'createdAt', label: 'Spot-Check-Referenzfotos', nullable: true },
  { model: 'vmSubmission', pathField: 'photoPath', dateField: 'submittedAt', label: 'VM-Einreichungen', nullable: false },
  { model: 'followUpAction', pathField: 'proofPhotoPath', dateField: 'resolvedAt', label: 'Follow-up-Nachweise', nullable: true },
  { model: 'auditResponse', pathField: 'photoPath', dateField: 'createdAt', label: 'Audit-Fotos', nullable: true },
  { model: 'checklistEntry', pathField: 'photoPath', dateField: 'answeredAt', label: 'Checklisten-Fotos', nullable: true },
];

/** DB-Pfad ("/uploads/spot-checks/x.jpg") → absoluter Dateipfad (analog zum Static-Mount). */
function resolveFile(dbPath: string): string {
  return path.join(UPLOAD_DIR, dbPath.replace(/^\/?uploads\/?/, ''));
}

async function unlinkQuiet(dbPath: string): Promise<void> {
  try {
    await fs.unlink(resolveFile(dbPath));
  } catch {
    // Datei evtl. bereits weg — kein harter Fehler
  }
}

/** Einmaliger Retention-Lauf. Gibt die Anzahl gelöschter Fotos zurück. */
export async function runPhotoRetention(): Promise<number> {
  if (!Number.isFinite(RETENTION_DAYS) || RETENTION_DAYS <= 0) {
    console.warn('⚠ RETENTION_DAYS ungültig — Foto-Retention übersprungen.');
    return 0;
  }
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;

  for (const t of TARGETS) {
    const delegate = (prisma as any)[t.model];
    if (!delegate) continue;
    try {
      // Bereits geleerte Werte ausschließen: null (nullbar) bzw. '' (Pflichtfeld).
      const cleared = t.nullable ? null : '';
      const rows: Array<{ id: string } & Record<string, any>> = await delegate.findMany({
        where: {
          [t.pathField]: { not: cleared },
          // Kein `not: null` am Datumsfeld — Prisma 7 lehnt das auf nicht-nullbaren
          // Feldern ab, und `lt` schließt Null-Werte ohnehin aus.
          [t.dateField]: { lt: cutoff },
        },
        select: { id: true, [t.pathField]: true },
      });
      if (rows.length === 0) continue;

      for (const row of rows) {
        const p = row[t.pathField];
        if (typeof p === 'string' && p.length > 0) await unlinkQuiet(p);
      }
      await delegate.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { [t.pathField]: cleared },
      });
      totalDeleted += rows.length;
      console.log(`  ↳ Retention: ${rows.length} ${t.label} gelöscht (älter als ${RETENTION_DAYS} Tage)`);
    } catch (err) {
      console.error(`Retention-Fehler bei ${t.model}:`, err);
    }
  }

  if (totalDeleted > 0) console.log(`✓ Foto-Retention: ${totalDeleted} Fotos insgesamt gelöscht.`);
  return totalDeleted;
}

/**
 * Startet die tägliche Retention. Erster Lauf kurz nach Start, dann alle 24 h.
 * Timer ist unref'd, damit er den Prozess nicht am Beenden hindert.
 */
export function startPhotoRetention(): void {
  const DAY_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => { void runPhotoRetention(); }, 60_000).unref();
  setInterval(() => { void runPhotoRetention(); }, DAY_MS).unref();
  console.log(`✓ Foto-Retention aktiv (Frist ${RETENTION_DAYS} Tage, täglicher Lauf).`);
}
