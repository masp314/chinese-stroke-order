#!/usr/bin/env bash
set -euo pipefail

owner="masp314"
repo="chinese-stroke-order"
remote_url="https://github.com/${owner}/${repo}.git"

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "GitHub login is required. Run: gh auth login -h github.com" >&2
  exit 1
fi

github_login="$(gh api user --jq .login)"
github_id="$(gh api user --jq .id)"

if [[ ! -d .git ]]; then
  git init -b main
fi

if [[ -z "$(git config user.name || true)" ]]; then
  git config user.name "${github_login}"
fi

if [[ -z "$(git config user.email || true)" ]]; then
  git config user.email "${github_id}+${github_login}@users.noreply.github.com"
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "Publish Chinese stroke order practice app"
fi

git branch -M main

if gh repo view "${owner}/${repo}" >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "${remote_url}"
  else
    git remote add origin "${remote_url}"
  fi
else
  gh repo create "${owner}/${repo}" \
    --public \
    --description "Child-friendly Chinese character stroke order and tracing PWA" \
    --source=. \
    --remote=origin
fi

git push --set-upstream origin main

echo
echo "Source pushed to: https://github.com/${owner}/${repo}"
echo "Next: open the repository's Settings > Pages and select GitHub Actions as the source."
