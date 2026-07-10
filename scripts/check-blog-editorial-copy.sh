#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -a files=()

for section in blog guides; do
  if [[ -d "$REPO/$section" ]]; then
    while IFS= read -r -d '' file; do
      files+=("$file")
    done < <(find "$REPO/$section" -mindepth 2 -maxdepth 2 -name index.html -print0)
  elif [[ -d "$REPO/public/$section" ]]; then
    while IFS= read -r -d '' file; do
      files+=("$file")
    done < <(find "$REPO/public/$section" -mindepth 2 -maxdepth 2 -name index.html -print0)
  fi
done

if ((${#files[@]} == 0)); then
  echo "Editorial copy check FAIL: no article or guide pages found." >&2
  exit 1
fi

status=0
for file in "${files[@]}"; do
  if rg -n -i 'Sources and community references|References used\.|<h3>[^<]*demand[^<]*</h3>|Demand came from|research notes|source dump' "$file"; then
    echo "Editorial copy check FAIL: internal workflow language appears in ${file#$REPO/}." >&2
    status=1
  fi

  if rg -q 'class="block source-list"' "$file"; then
    if ! rg -q '<p class="kicker">Sources</p>' "$file" ||
       ! rg -q '<h2>Documentation and further reading</h2>' "$file"; then
      echo "Editorial copy check FAIL: source labels are not standardized in ${file#$REPO/}." >&2
      status=1
    fi
  fi
done

if ((status != 0)); then
  exit 1
fi

echo "Editorial copy check PASS: ${#files[@]} article and guide pages checked."
