# Server-Migration & Härtung — Runbook (KORE Prod, Dior-Pilot)

Stand: Juni 2026 · Ziel: dedizierter, gehärteter Server für KORE-Produktion, der ein
LVMH-/Dior-Vendor-Security-Assessment besteht. Auszuführen, sobald der Zielserver bereitsteht.

## Warum (Befund aus dem Audit, 10.6.2026)
Die aktuelle Produktion teilt sich eine Hetzner-Maschine mit 5+ fremden Projekten (everthine-api,
cockpit, openclaw/Lotta inkl. WhatsApp, Blog-Generator). Alles läuft als **root**, mehrere
Node-Dienste binden öffentlich an nginx vorbei (Ports 3002/5000/18789). Das ist der größte
Compliance-Blocker und mit Hardening allein auf der Shared-Maschine nicht sauber lösbar.

## Zielarchitektur
- **Eigener Hetzner-Cloud-Server** (Standort Deutschland — Nürnberg/Falkenstein), nur KORE-Prod
- Dedizierter **Service-User** `kore` (NICHT root) für App + PM2
- **Firewall**: nur 22 (SSH, key-only), 80, 443 offen; alle App-Ports nur auf `127.0.0.1`
- **TLS** via Let's Encrypt (certbot), HSTS, nur app/dashboard/kore-retail Subdomains
- **Verschlüsselte tägliche Backups** (DB + Uploads) auf Hetzner Storage Box, Offsite, getestet
- **Monitoring/Uptime** + zentrales Logging
- Optionale **Festplattenverschlüsselung** (LUKS) — bei Hetzner Cloud via Rescue/Encrypted-Image

## Vorbedingungen (durch Nicole bereitzustellen)
- [ ] Hetzner-Server provisioniert (Ubuntu 24.04 LTS, ≥ 4 GB RAM, Standort DE)
- [ ] DNS-Zugriff (Records für app/dashboard/kore-retail auf neue IP umziehen)
- [ ] Hetzner Storage Box (Backups) angelegt
- [ ] SSH-Public-Key hinterlegt

## Ablauf (von mir ausführbar, sobald Zugang besteht)

### 1. Grundhärtung
```bash
# Service-User statt root
adduser --disabled-password --gecos "" kore
usermod -aG sudo kore
# SSH härten: kein Root-Login, kein Passwort-Login
#   PermitRootLogin no / PasswordAuthentication no / AllowUsers kore
# UFW-Firewall
ufw default deny incoming; ufw default allow outgoing
ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw enable
# Automatische Sicherheitsupdates
apt install -y unattended-upgrades fail2ban
```

### 2. Laufzeitumgebung
- Node LTS (über nvm im `kore`-Home), PM2 als `kore`-User (nicht root)
- nginx als Reverse-Proxy; App lauscht nur auf `127.0.0.1:3001`
- `.env` mit `chmod 600`, Owner `kore`; Secrets NEU generieren (JWT_SECRET, JWT_REFRESH_SECRET rotieren)

### 3. Deploy der App (feature/dior-pilot → main nach Freigabe)
```bash
git clone <repo> /home/kore/kore-app
cd kore-app && ./deploy.sh   # installiert, baut, prisma db push, pm2 start
```
- `prisma db push` legt die neuen Tabellen an (PhotoRequest, PhotoRequestTarget, FollowUpAction)
- PM2: `pm2 startup` + `pm2 save` für Reboot-Persistenz

### 4. Backups (täglich, verschlüsselt, getestet)
```bash
# /home/kore/backup.sh — kore.db + uploads/, GPG-verschlüsselt, rsync auf Storage Box
# Cron: 0 3 * * *  ; Retention 30 Tage ; monatlicher Restore-Test dokumentieren
```
- SQLite konsistent sichern: `sqlite3 kore.db ".backup '/tmp/kore-$(date +%F).db'"` (nicht copy)

### 5. TLS + Security-Header
- certbot für app./dashboard./kore-retail.de; HSTS aktiv
- CSP bereits im Code gehärtet (img-src blob: für AuthImage), Helmet an in Produktion

### 6. Cutover
- [ ] Staging auf neuem Server, voll testen (beide Hero-Tools + Foto-Flows)
- [ ] DNS-TTL vorab senken; Wartungsfenster ankündigen
- [ ] DNS umstellen, alten Server read-only/abschalten
- [ ] Smoke-Test Produktion, 24 h Monitoring

## Verifikations-Checkliste (Dior-Review-tauglich)
- [ ] Kein Root-Login möglich, SSH key-only, fail2ban aktiv
- [ ] `ss -tlnp` zeigt extern nur 22/80/443
- [ ] App läuft als `kore`, nicht root
- [ ] Secrets 600, rotiert, nicht im Git
- [ ] Backup erfolgreich + Restore getestet (Datum dokumentiert)
- [ ] TLS A-Rating (SSL Labs), HSTS
- [ ] Keine Fremdprojekte auf der Maschine
- [ ] Audit-Log aktiv (AuditLog-Model), Rate-Limiting aktiv
- [ ] Optional: externer Pen-Test beauftragt (vor Go-Live)

## Offene Entscheidungen
- Hetzner Cloud vs. Dedicated Root (Cloud reicht für Pilot, einfacher)
- Festplattenverschlüsselung ja/nein (LVMH fragt das oft ab → Empfehlung: ja)
- MFA für Admin-Logins: Umsetzung in der App (TOTP) — separater Task, siehe Roadmap
