#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
failures=0
checked=0
declare -A seen_hashes=()

while IFS= read -r -d '' meta; do
  checked=$((checked + 1))
  rel="${meta#"$repo"/}"
  cover="${meta%/cover-meta.json}/cover.png"
  generator="$(jq -r '.generator_used // .generator // ""' "$meta")"

  case "${generator,,}" in
    *local-pillow*|*deterministic*)
      printf 'Blog cover quality FAIL: %s identifies a draft fallback generator (%s).\n' "$rel" "$generator"
      failures=$((failures + 1))
      ;;
  esac

  if [[ ! -s "$cover" ]] || (( $(stat -c %s "$cover" 2>/dev/null || printf '0') < 1024 )); then
    printf 'Blog cover quality FAIL: %s is missing a usable cover.png.\n' "$rel"
    failures=$((failures + 1))
    continue
  fi

  hash="$(sha256sum "$cover" | awk '{print $1}')"
  if [[ -n "${seen_hashes[$hash]:-}" ]]; then
    printf 'Blog cover quality FAIL: %s duplicates %s byte-for-byte.\n' \
      "${cover#"$repo"/}" "${seen_hashes[$hash]}"
    failures=$((failures + 1))
  else
    seen_hashes[$hash]="${cover#"$repo"/}"
  fi
done < <(find "$repo/assets/generated/blog" -mindepth 2 -maxdepth 2 -name cover-meta.json -print0)

if (( failures > 0 )); then
  exit 1
fi

printf 'Blog cover quality PASS: %d unique final covers; no deterministic fallback metadata.\n' "$checked"
