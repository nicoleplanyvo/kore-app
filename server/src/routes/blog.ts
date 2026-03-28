import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { sendEmail, blogApprovalEmail } from '../lib/email.js';

export const blogRouter = Router();

const BLOG_API_KEY = process.env['BLOG_API_KEY'] ?? '';
const PUBLIC_URL = process.env['PUBLIC_URL'] ?? 'https://app.kore-retail.de';

// ── Middleware: API Key Check ────────────────
function requireBlogApiKey(req: any, res: any, next: any) {
  const key = req.headers['x-blog-api-key'];
  if (!BLOG_API_KEY || !key || key !== BLOG_API_KEY) {
    return res.status(401).json({ error: 'Ungültiger API-Key.' });
  }
  next();
}

// ── POST /api/blog/posts — Lotta erstellt Draft ──
blogRouter.post('/posts', requireBlogApiKey, async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImageUrl, author } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'title, slug und content sind Pflichtfelder.' });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.' });
    }

    const approvalToken = crypto.randomUUID();

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt ?? '',
        content,
        coverImageUrl: coverImageUrl ?? null,
        author: author ?? 'Lotta',
        approvalToken,
      },
    });

    // Approval-Email an Nicole senden
    const approveUrl = `${PUBLIC_URL}/api/blog/approve?token=${approvalToken}&action=approve`;
    const rejectUrl = `${PUBLIC_URL}/api/blog/approve?token=${approvalToken}&action=reject`;

    const emailResult = await sendEmail(
      blogApprovalEmail({
        title,
        excerpt: excerpt ?? '',
        previewContent: content.substring(0, 800),
        approveUrl,
        rejectUrl,
      }),
    );

    console.log(`[blog] Draft erstellt: "${title}" (${post.id}), Email: ${emailResult.success ? 'gesendet' : emailResult.error}`);

    res.status(201).json({ ...post, emailSent: emailResult.success });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ein Post mit diesem Slug existiert bereits.' });
    }
    console.error('[blog] Fehler:', err);
    res.status(500).json({ error: 'Interner Fehler.' });
  }
});

// ── GET /api/blog/posts — Öffentliche Liste ──
blogRouter.get('/posts', async (_req, res) => {
  try {
    const page = Math.max(1, parseInt(_req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(_req.query.pageSize as string) || 10));

    const [data, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          author: true,
          publishedAt: true,
        },
      }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('[blog] Liste-Fehler:', err);
    res.status(500).json({ error: 'Interner Fehler.' });
  }
});

// ── GET /api/blog/posts/:slug — Einzelner Post ──
blogRouter.get('/posts/:slug', async (req, res) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImageUrl: true,
        author: true,
        publishedAt: true,
      },
    });

    if (!post) return res.status(404).json({ error: 'Post nicht gefunden.' });
    res.json(post);
  } catch (err) {
    console.error('[blog] Detail-Fehler:', err);
    res.status(500).json({ error: 'Interner Fehler.' });
  }
});

// ── GET /api/blog/approve — Freigabe/Ablehnung via Email-Link ──
blogRouter.get('/approve', async (req, res) => {
  const { token, action } = req.query;

  if (!token || !action || !['approve', 'reject'].includes(action as string)) {
    return res.status(400).send(approvalPage('Ungültiger Link', 'Dieser Link ist fehlerhaft.', false));
  }

  try {
    const post = await prisma.blogPost.findFirst({
      where: { approvalToken: token as string, status: 'DRAFT' },
    });

    if (!post) {
      return res.send(approvalPage('Link abgelaufen', 'Dieser Blogbeitrag wurde bereits bearbeitet oder der Link ist ungültig.', false));
    }

    if (action === 'approve') {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          approvalToken: crypto.randomUUID(),
        },
      });
      console.log(`[blog] Freigegeben: "${post.title}"`);
      return res.send(approvalPage('Beitrag freigegeben!', `"${post.title}" ist jetzt live auf der Webseite.`, true));
    } else {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          status: 'REJECTED',
          approvalToken: crypto.randomUUID(),
        },
      });
      console.log(`[blog] Abgelehnt: "${post.title}"`);
      return res.send(approvalPage('Beitrag abgelehnt', `"${post.title}" wurde nicht veröffentlicht.`, false));
    }
  } catch (err) {
    console.error('[blog] Approval-Fehler:', err);
    res.status(500).send(approvalPage('Fehler', 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.', false));
  }
});

// ── HTML-Seite für Approval-Bestätigung ──
function approvalPage(title: string, message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KORE Blog — ${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #F7F4EF; font-family: 'Jost', sans-serif; color: #1C1A17; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 460px; padding: 48px 40px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: 'Cormorant', Georgia, serif; font-size: 28px; font-weight: 400; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #524E46; }
    .line { width: 48px; height: 2px; background: #9E8460; margin: 24px auto; }
    a { color: #9E8460; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '&#10003;' : '&#128203;'}</div>
    <h1>${title}</h1>
    <div class="line"></div>
    <p>${message}</p>
    <p style="margin-top: 32px;"><a href="/">Zurueck zu KORE</a></p>
  </div>
</body>
</html>`;
}
