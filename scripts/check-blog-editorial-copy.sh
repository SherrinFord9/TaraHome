#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo"

declare -a pages=()
if (( $# > 0 )); then
  pages=("$@")
else
  while IFS= read -r page; do
    [[ -n "$page" ]] && pages+=("$page")
  done < <(
    {
      git diff --name-only --diff-filter=ACMR HEAD -- 'blog/*/index.html'
      git ls-files --others --exclude-standard -- 'blog/*/index.html'
    } | sort -u
  )
fi

if (( ${#pages[@]} == 0 )); then
  echo "Editorial copy check: no changed article pages to check."
  exit 0
fi

failed=0
for page in "${pages[@]}"; do
  [[ -f "$page" ]] || continue

  if ! grep -Fq '<p class="kicker">Sources</p>' "$page"; then
    echo "Editorial copy FAIL: $page must use the source kicker 'Sources'." >&2
    failed=1
  fi

  if ! grep -Fq '<h2>Documentation and further reading</h2>' "$page"; then
    echo "Editorial copy FAIL: $page must use the source heading 'Documentation and further reading'." >&2
    failed=1
  fi

  if grep -Eiq 'Sources and community references|References used|Demand came from|research notes|source dump|<h[1-6][^>]*>[^<]*demand' "$page"; then
    echo "Editorial copy FAIL: $page exposes internal research/source-workflow language." >&2
    failed=1
  fi
done

if (( failed )); then
  exit 1
fi

echo "Editorial copy PASS: ${#pages[@]} changed article page(s) use customer-facing source labels."
