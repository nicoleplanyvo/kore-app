#!/bin/sh
# Xcode Cloud: laeuft nach dem Klonen des Repos, VOR dem xcodebuild.
# Baut das Web-Bundle (Vite) mit der Prod-API und kopiert es ins iOS-Projekt —
# das, was lokal `npm run sync:native` erledigt.
set -e

echo "=== KORE ci_post_clone: Node installieren ==="
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node@20 2>/dev/null || brew install node
export PATH="/opt/homebrew/opt/node@20/bin:/usr/local/opt/node@20/bin:$PATH"
node --version
npm --version

echo "=== Abhaengigkeiten (Repo-Root + Client) ==="
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install --no-audit --no-fund
cd client
npm install --no-audit --no-fund

echo "=== Web-Bundle bauen (Prod-API) + in iOS-Projekt kopieren ==="
npm run build:native
npx cap copy ios

echo "=== KORE ci_post_clone fertig ==="
