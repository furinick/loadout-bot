#!/bin/bash
set -e

echo "🔄 Redeploying loadout-bot..."

# Register slash commands
npx tsx src/deploy-commands.ts

# Restart pm2 process
pm2 restart loadout-bot 2>/dev/null || pm2 start "npx tsx src/index.ts" --name loadout-bot

echo "✅ Done"
