#!/usr/bin/env bash
set -euo pipefail

REPO="/home/sherrinford/Projects_HA/Tara_website/TaraHome"
STATE_DIR="${TARAHOME_BLOG_STATE_DIR:-$HOME/.local/state/tarahome-blog-run}"
export PATH="$HOME/.local/share/fnm/node-versions/v22.22.1/installation/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

mkdir -p "$STATE_DIR"
# Read the deployed runner without changing the user's main worktree or draft.
git -C "$REPO" fetch origin main
RUNNER="$(mktemp "$STATE_DIR/runner.XXXXXX.py")"
trap 'rm -f "$RUNNER"' EXIT
git -C "$REPO" show origin/main:scripts/blog-runner.py > "$RUNNER"
python3 "$RUNNER" --repo "$REPO" --state-dir "$STATE_DIR" "$@"
