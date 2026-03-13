#!/bin/bash
set -e

echo "═══════════════════════════════════════"
echo "  KORE App — Deploy"
echo "═══════════════════════════════════════"

# 1. Server Dependencies + Prisma
echo ""
echo "▸ Installing server dependencies..."
cd server && npm install && cd ..

echo ""
echo "▸ Generating Prisma client..."
cd server && npx prisma generate && cd ..

echo ""
echo "▸ Pushing database schema..."
cd server && npx prisma db push && cd ..

# 2. Client Dependencies
echo ""
echo "▸ Installing client dependencies..."
cd client && npm install && cd ..

# 3. Build Server
echo ""
echo "▸ Building server..."
cd server && npm run build && cd ..

# 5. Build Client
echo ""
echo "▸ Building client..."
cd client && npm run build && cd ..

# 6. Restart Passenger
echo ""
echo "▸ Restarting Passenger..."
mkdir -p tmp && touch tmp/restart.txt

echo ""
echo "═══════════════════════════════════════"
echo "  ✓ Deploy complete!"
echo "═══════════════════════════════════════"
