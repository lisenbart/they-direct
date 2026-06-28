#!/bin/bash
set -euo pipefail
cd /Users/dmytrolisenbart/Desktop/TheyDirect
export GIT_SSH_COMMAND='ssh -i ~/.ssh/id_ed25519_github -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new'
REPO="they-direct"
USER="${GITHUB_USER:-}"
if [[ -z "$USER" ]]; then
  MSG="$(ssh -T git@github.com 2>&1 || true)"
  if [[ "$MSG" =~ Hi\ ([^!]+)! ]]; then USER="${BASH_REMATCH[1]}"; fi
fi
USER="${USER:-scoopy-log}"
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
  echo "SSH: $(ssh -T git@github.com 2>&1 || true)"
  if ! git push -u origin main; then
    echo "If push failed because the repo is missing, create it: https://github.com/new?name=$REPO (public, no README), then re-run this script."
    exit 1
  fi
  echo "Enable GitHub Pages: Settings → Pages → Build from branch main, folder / (root)."
fi
echo ""
echo "Repo: https://github.com/$USER/$REPO"
echo "Site: https://$USER.github.io/$REPO/"
