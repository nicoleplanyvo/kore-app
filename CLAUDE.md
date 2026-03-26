# KORE App — Context for Claude

## Hosting & Deployment
- Hosting: Hetzner (NICHT Plesk) — umgezogen von Plesk/craft.serverforall.de
- Domains: kore-retail.de, app.kore-retail.de, dashboard.kore-retail.de, lotta.kore-retail.de
- Alle Subdomains zeigen auf 195.201.119.214 (Hetzner)
- Eigentümer: Muñoz Bonilla GmbH, Benediktusstraße 46, 40549 Düsseldorf (NICHT planyvo GmbH)
- GF: Nicole Muñoz Bonilla, HRB 88958 Amtsgericht Düsseldorf

## Architektur
- Monorepo: client/ (React 19 + Vite + TailwindCSS) + server/ (Express + Prisma + SQLite) + shared/
- GitHub: github.com/nicoleplanyvo/kore-app
- 35 Tools (34 Retail-Tools + Metrix), je mit: server route, client hooks, client pages
- Role hierarchy: kore_admin > tenant_admin > regional_manager > multisite_manager > store_manager > learner

## KORE CI Design System
- Fonts: Cormorant (display/headings), Jost (body)
- Primary: brass #9E8460
- KEINE Emojis in UI — nur Lucide Icons
- CSS: font-display, text-body, text-kore-ink, text-kore-mid, text-kore-brass, kore-bg, kore-surface

## Code Patterns
- Server: `req.user!.sub` für User-ID, `(req as any).toolStoreIds as string[] | 'all'` für Store-Zugriff
- Client: `api()` fetch wrapper aus `client/src/lib/api.ts`, React Query hooks
- Middleware: `authenticate` → `requireToolAccess('category.tool_key')`
- Tool routes: server/src/routes/tools/{tool-name}/index.ts
- Tool hooks: client/src/hooks/use{ToolName}.ts
- Tool pages: client/src/tools/{tool-name}/pages/*.tsx

## Häufige Fehler
- Deutsche Umlaute: IMMER ä/ö/ü/ß verwenden, NIE ae/oe/ue/ss
- Prisma String-Felder: `.toISOString()` bei Date-Vergleichen (gte/lte), nicht Date-Objekte
- `_sum` bei Prisma aggregate: Optional chaining `._sum?.amount` verwenden
- Array-Index: `(arr[i] ?? 0) + 1` statt `arr[i]++` (TS noUncheckedIndexedAccess)
- Orphan pages: Beim Rebuild alter Tools alte Seiten löschen wenn Router sie nicht mehr referenziert
- Git worktree lock: Bei >10 parallelen Agents git lock Fehler möglich — max 7 parallel

## Sprache
- UI-Sprache: Deutsch
- Code/Variablen: Englisch
- User antwortet oft mit Einzelbuchstaben (a/b/c/d) auf Q&A-Fragen
