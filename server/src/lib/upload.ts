import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? './uploads';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Erstellt eine Multer-Instanz für ein bestimmtes Tool.
 * Dateien werden unter UPLOAD_DIR/{toolSlug}/{tenantId}/{sessionId}/ gespeichert.
 *
 * Erwartet req.tenantId (von requireToolAccess Middleware) und req.params.sessionId.
 */
export function createToolUpload(toolSlug: string) {
  const storage = multer.diskStorage({
    destination: async (req, _file, cb) => {
      try {
        const tenantId = (req as any).tenantId as string;
        const sessionId = req.params['sessionId'] as string;
        const dir = path.join(UPLOAD_DIR, toolSlug, tenantId, sessionId);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const criterionId = req.params['criterionId'] as string;
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${criterionId}-${Date.now()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt.'));
      }
    },
  });
}

// Erweiterte Allowlist für Handy-Kameras (iPhone liefert HEIC/HEIF)
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * Gehärteter Foto-Upload für flache Tool-Verzeichnisse (z. B. Spot-Checks, Follow-ups):
 * generierter Dateiname statt Original-Dateiname (kein Path-Traversal, keine Kollisionen),
 * MIME-Allowlist nur für Bilder, 10-MB-Limit.
 */
export function makeImageUpload(subdir: string) {
  const dir = path.resolve('data/uploads', subdir);
  if (!fsSync.existsSync(dir)) fsSync.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => {
        const ext = IMAGE_EXTENSIONS[file.mimetype] ?? 'jpg';
        cb(null, `${Date.now()}-${crypto.randomUUID()}.${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (IMAGE_EXTENSIONS[file.mimetype]) cb(null, true);
      else cb(new Error('Nur Bilddateien sind erlaubt (JPEG, PNG, WebP, HEIC).'));
    },
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

/** Gibt den absoluten Pfad zu einer Upload-Datei zurück */
export function getUploadPath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath);
}

/** Gibt den relativen Pfad für die Datenbank zurück */
export function getRelativePath(toolSlug: string, tenantId: string, sessionId: string, filename: string): string {
  return path.join(toolSlug, tenantId, sessionId, filename);
}

/** Löscht eine Upload-Datei */
export async function deleteUploadFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, relativePath));
  } catch (error) {
    // Datei existiert evtl. nicht mehr — kein harter Fehler
    console.error('Fehler beim Löschen der Datei:', relativePath, error);
  }
}

export { UPLOAD_DIR };
