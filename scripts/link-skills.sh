#!/usr/bin/env bash
set -euo pipefail

# Symlinks every skill in this repo into ~/.claude/skills so the local Claude
# CLI picks them up without installing the plugin. Re-run after adding skills.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.claude/skills"

# Guard: if ~/.claude/skills is a symlink pointing back into this repo, bail out
# rather than writing per-skill symlinks into our own working tree.
if [ -L "$DEST" ]; then
  resolved="$(readlink "$DEST")"
  case "$resolved" in
    "$REPO" | "$REPO"/*)
      echo "error: $DEST is a symlink into this repo ($resolved)." >&2
      echo "Remove it (rm \"$DEST\") and re-run." >&2
      exit 1
      ;;
  esac
fi

mkdir -p "$DEST"

find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -print0 |
  while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    target="$DEST/$name"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    echo "linked $name -> $src"
  done
