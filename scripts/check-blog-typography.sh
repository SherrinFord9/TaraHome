#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

declare -a pages=()

if [[ "${1:-}" == "--all" ]]; then
  pages=(blog.html blog/index.html)
  while IFS= read -r page; do
    pages+=("$page")
  done < <(find blog -mindepth 2 -maxdepth 2 -name index.html -print | sort)
elif (( $# > 0 )); then
  pages=("$@")
else
  while IFS= read -r page; do
    case "$page" in
      blog.html|blog/index.html|blog/*/index.html) pages+=("$page") ;;
    esac
  done < <(git diff --cached --name-only --diff-filter=ACMR)
fi

if (( ${#pages[@]} == 0 )); then
  echo "Typography check: no staged library or article pages to check."
  exit 0
fi

failed=0
for page in "${pages[@]}"; do
  [[ -f "$page" ]] || continue

  if ! grep -Fq '<link rel="preload" as="font" href="/fonts/Avenir_Book.woff2"' "$page"; then
    echo "Typography FAIL: $page does not preload /fonts/Avenir_Book.woff2." >&2
    failed=1
  fi

  if ! grep -Fq "font-family: 'Tara Avenir';" "$page"; then
    echo "Typography FAIL: $page does not register the Tara Avenir font face." >&2
    failed=1
  fi

  if ! grep -Fq "font-family: 'Tara Avenir', 'Avenir Next', ui-sans-serif, system-ui, sans-serif;" "$page"; then
    echo "Typography FAIL: $page does not use the Tara font stack." >&2
    failed=1
  fi

  if grep -Eq 'font-weight:[[:space:]]*400[[:space:]]+800;' "$page"; then
    echo "Typography FAIL: $page falsely declares static Avenir Book as a variable 400-800 face." >&2
    failed=1
  fi

  if ! grep -Fq '/* tara-blog-typography-v3:start */' "$page"; then
    echo "Typography FAIL: $page is missing the canonical blog typography block." >&2
    failed=1
  fi

  if ! grep -Fq 'h1,h2,h3{font-weight:400;}' "$page"; then
    echo "Typography FAIL: $page does not preserve regular-weight Tara headings." >&2
    failed=1
  fi

  if ! grep -Fq '.blog-card h2,.blog-card p{font-weight:400;}' "$page"; then
    echo "Typography FAIL: $page does not preserve the library card weight hierarchy." >&2
    failed=1
  fi

  if ! grep -Fq '.article-body p,.article-body li{font-weight:400;}' "$page"; then
    echo "Typography FAIL: $page does not preserve readable article body weights." >&2
    failed=1
  fi

  if grep -Fq 'font-family: Avenir, Inter' "$page"; then
    echo "Typography FAIL: $page still uses the unregistered Avenir/Inter fallback stack." >&2
    failed=1
  fi
done

if (( failed )); then
  echo "Fix the Tara font contract before committing." >&2
  exit 1
fi

echo "Typography PASS: ${#pages[@]} library/article page(s) use Tara Avenir."
