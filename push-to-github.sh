#!/bin/bash
set -e

REPO="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/ankur6779/kidschedule.git"

git config user.email "ankur6779@users.noreply.github.com"
git config user.name "ankur6779"

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

git add -A
git commit -m "backup: full project snapshot $(date '+%Y-%m-%d %H:%M')" --allow-empty
git branch -M main
git push -u origin main --force

echo ""
echo "Done! Repo: https://github.com/ankur6779/kidschedule"
