#!/bin/bash
# Run this once locally to remove large generated files from git history tracking.
# Files stay on disk — git just stops watching them.

git rm --cached api/handler.js 2>/dev/null && echo "✓ removed api/handler.js"
git rm --cached api/handler.js.map 2>/dev/null && echo "✓ removed api/handler.js.map"
git rm -r --cached .migration-backup/ 2>/dev/null && echo "✓ removed .migration-backup/"
git rm -r --cached attached_assets/ 2>/dev/null && echo "✓ removed attached_assets/"

echo ""
echo "Now run:"
echo "  git commit -m 'Remove large generated files from git tracking'"
echo "  git push"
