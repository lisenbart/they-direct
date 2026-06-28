#!/bin/bash
set -euo pipefail

REPO="they-direct"
USER="lisenbart"
DIR="/Users/dmytrolisenbart/Desktop/TheyDirect"
KEY="$HOME/.ssh/id_ed25519_github"

cd "$DIR"

echo "=== They Direct → GitHub Pages ==="
echo ""

# Load SSH key
if [[ -f "$KEY" ]]; then
  ssh-add --apple-use-keychain "$KEY" 2>/dev/null || ssh-add "$KEY" 2>/dev/null || true
fi

# Test GitHub SSH
MSG="$(ssh -T git@github.com 2>&1 || true)"
echo "SSH: $MSG"

if [[ "$MSG" != *"Hi "* ]]; then
  echo ""
  echo "SSH не працює. Додай ключ на GitHub:"
  echo "  https://github.com/settings/ssh/new"
  echo ""
  cat "${KEY}.pub"
  echo ""
  echo "Скопіюй: pbcopy < ${KEY}.pub"
  echo "Після додавання ключа — запусти цей скрипт знову."
  read -r -p "Натисни Enter щоб закрити..."
  exit 1
fi

git remote set-url origin "git@github.com:${USER}/${REPO}.git"

# Commit any pending changes
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "Update deploy scripts" || true
fi

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "Enabling GitHub Pages..."

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh api "repos/${USER}/${REPO}/pages" -X POST -f source[branch]=main -f source[path]=/ 2>/dev/null || \
    gh api "repos/${USER}/${REPO}/pages" -X PUT -f source[branch]=main -f source[path]=/ 2>/dev/null || true
  echo "Pages enabled via gh CLI."
else
  echo "Увімкни Pages вручну (один раз):"
  echo "  https://github.com/${USER}/${REPO}/settings/pages"
  echo "  Branch: main, Folder: / (root)"
  open "https://github.com/${USER}/${REPO}/settings/pages" 2>/dev/null || true
fi

echo ""
echo "✓ Готово!"
echo ""
echo "Сайт (через 1-2 хв):  https://${USER}.github.io/${REPO}/"
echo "Репо:                   https://github.com/${USER}/${REPO}"
echo ""
read -r -p "Натисни Enter щоб закрити..."
