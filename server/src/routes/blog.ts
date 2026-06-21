import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Types
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string;
  keywords: string[];
  author: string;
  date: string;
  readingTime: string;
  wordCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogDatabase {
  posts: BlogPost[];
}

// Blog-Datenbank Pfad
const BLOG_DB_PATH = path.join(process.cwd(), 'data', 'blog.json');

// Blog-Datenbank laden/erstellen
async function loadBlogDatabase(): Promise<BlogDatabase> {
  try {
    const data = await fs.readFile(BLOG_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Erstelle leere Datenbank falls nicht vorhanden
    const emptyDb: BlogDatabase = { posts: [] };
    await fs.mkdir(path.dirname(BLOG_DB_PATH), { recursive: true });
    await fs.writeFile(BLOG_DB_PATH, JSON.stringify(emptyDb, null, 2));
    return emptyDb;
  }
}

// Blog-Datenbank speichern
async function saveBlogDatabase(data: BlogDatabase): Promise<void> {
  await fs.writeFile(BLOG_DB_PATH, JSON.stringify(data, null, 2));
}

// Lotta API Key Check
function checkLottaAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.LOTTA_API_KEY || 'lotta-blog-key-2026';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
}

// GET /api/blog/posts - Alle Posts abrufen
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const db = await loadBlogDatabase();
    const posts = db.posts
      .filter(p => p.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ posts });
  } catch (error) {
    console.error('Blog GET error:', error);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
});

// GET /api/blog/posts/:slug - Einzelnen Post abrufen
router.get('/posts/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const db = await loadBlogDatabase();
    const post = db.posts.find(p => p.slug === slug && p.published);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ post });
  } catch (error) {
    console.error('Blog GET single error:', error);
    res.status(500).json({ error: 'Failed to load blog post' });
  }
});

// POST /api/blog/posts - Neuen Post erstellen (Lotta only)
router.post('/posts', checkLottaAuth, async (req: Request, res: Response) => {
  try {
    const { title, slug, excerpt, content, meta_description, keywords, author, date, readingTime, wordCount } = req.body;
    
    // Validierung
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug and content are required' });
    }
    
    const db = await loadBlogDatabase();
    
    // Prüfe ob slug bereits existiert
    if (db.posts.find(p => p.slug === slug)) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    
    // Neuen Post erstellen
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title,
      slug,
      excerpt: excerpt || '',
      content,
      meta_description: meta_description || '',
      keywords: keywords || [],
      author: author || 'KORE Team',
      date: date || new Date().toISOString().split('T')[0],
      readingTime: readingTime || '5 Minuten',
      wordCount: wordCount || 0,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.posts.push(newPost);
    await saveBlogDatabase(db);
    
    console.log(`✓ Blog post created: ${title} (${slug})`);
    res.status(201).json({ post: newPost, message: 'Blog post created successfully' });
    
  } catch (error) {
    console.error('Blog POST error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// PUT /api/blog/posts/:slug - Post aktualisieren (Lotta only)
router.put('/posts/:slug', checkLottaAuth, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updates = req.body;
    
    const db = await loadBlogDatabase();
    const postIndex = db.posts.findIndex(p => p.slug === slug);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Post aktualisieren
    db.posts[postIndex] = {
      ...db.posts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveBlogDatabase(db);
    
    console.log(`✓ Blog post updated: ${slug}`);
    res.json({ post: db.posts[postIndex], message: 'Blog post updated successfully' });
    
  } catch (error) {
    console.error('Blog PUT error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// DELETE /api/blog/posts/:slug - Post löschen (Lotta only)
router.delete('/posts/:slug', checkLottaAuth, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const db = await loadBlogDatabase();
    const postIndex = db.posts.findIndex(p => p.slug === slug);
    
    if (postIndex === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const deletedPost = db.posts.splice(postIndex, 1)[0];
    await saveBlogDatabase(db);
    
    console.log(`✓ Blog post deleted: ${slug}`);
    res.json({ post: deletedPost, message: 'Blog post deleted successfully' });
    
  } catch (error) {
    console.error('Blog DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

export { router as blogRouter };