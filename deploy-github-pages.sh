#!/bin/bash
set -euo pipefail

cd /Users/dmytrolisenbart/Desktop/TheyDirect

REPO="they-direct"
KEY="$HOME/.ssh/id_ed25519_github"
export GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# Load SSH key into agent (macOS Keychain)
if [[ -f "$KEY" ]]; then
  ssh-add --apple-use-keychain "$KEY" 2>/dev/null || ssh-add "$KEY" 2>/dev/null || true
fi

USER="${GITHUB_USER:-}"
MSG="$(ssh -T git@github.com 2>&1 || true)"
echo "SSH test: $MSG"

if [[ "$MSG" =~ Hi\ ([^!]+)! ]]; then
  USER="${BASH_REMATCH[1]}"
elif [[ "$MSG" == *"Permission denied (publickey)"* ]]; then
  echo ""
  echo "GitHub rejected your SSH key. Add this public key to GitHub:"
  echo "  https://github.com/settings/ssh/new"
  echo ""
  cat "${KEY}.pub"
  echo ""
  echo "Copy with:  pbcopy < ${KEY}.pub"
  echo "Then re-run:  bash $0"
  exit 1
fi

USER="${USER:-lisenbart}"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  if ! gh repo view "$USER/$REPO" >/dev/null 2>&1; then
    gh repo create "$REPO" --public --source=. --remote=origin --push --description "They Direct landing page"
  else
    git remote set-url origin "git@github.com:$USER/$REPO.git"
    git push -u origin main
  fi
  gh api "repos/$USER/$REPO/pages" -X POST -f source[branch]=main -f source[path]=/ 2>/dev/null || \
    gh api "repos/$USER/$REPO/pages" -X PUT -f source[branch]=main -f source[path]=/ 2>/dev/null || true
else
  git remote set-url origin "git@github.com:$USER/$REPO.git"

  if ! git push -u origin main 2>&1; then
    echo ""
    echo "Push failed. If the repo does not exist yet, create it first:"
    echo "  https://github.com/new?name=$REPO  (public, no README)"
    echo "Then re-run:  bash $0"
    exit 1
  fi

  echo ""
  echo "Enable GitHub Pages (one-time):"
  echo "  https://github.com/$USER/$REPO/settings/pages"
  echo "  Branch: main, Folder: / (root)"
fi

echo ""
echo "Repo: https://github.com/$USER/$REPO"
echo "Site: https://$USER.github.io/$REPO/"
