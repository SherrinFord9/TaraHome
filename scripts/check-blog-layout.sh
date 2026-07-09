#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
failures=0
checked=0

while IFS= read -r -d '' page; do
  checked=$((checked + 1))
  if ! grep -qF '/* tara-blog-layout-v2:start */' "$page"; then
    printf 'Blog layout check FAIL: %s is missing the v2 layout contract.\n' "${page#"$repo"/}"
    failures=$((failures + 1))
  fi
  if ! grep -Eq 'margin-left:[[:space:]]*auto;' "$page" || \
     ! grep -Eq 'grid-template-columns:[[:space:]]*repeat\(2,[[:space:]]*minmax\(0,[[:space:]]*1fr\)\);' "$page"; then
    printf 'Blog layout check FAIL: %s is missing centered reading or two-column library rules.\n' "${page#"$repo"/}"
    failures=$((failures + 1))
  fi
done < <(find "$repo/blog" -mindepth 1 -maxdepth 2 -name index.html -print0)

for page in "$repo/blog.html" "$repo/blog/index.html"; do
  [[ -f "$page" ]] || continue
  if ! grep -qF '/* tara-blog-layout-v2:start */' "$page"; then
    printf 'Blog layout check FAIL: %s is missing the v2 layout contract.\n' "${page#"$repo"/}"
    failures=$((failures + 1))
  fi
done

if (( failures > 0 )); then
  exit 1
fi

printf 'Blog layout check PASS: %d article and index pages checked.\n' "$checked"
