#!/usr/bin/env bash
# Install this repository's skills at user level (~/.claude/skills), so they
# are available in every project instead of only in this repository.
#
#   bash .claude/skills/install-user-level.sh
#
# The repository copy stays the source of truth. ~/.claude/skills is local to
# the machine (and on an ephemeral container it does not survive a restart),
# so re-run this after the environment is rebuilt.
#
# Documented script paths differ between the two locations: in the repository
# they are relative to the repository root, at user level they must work from
# any working directory. This script rewrites them to "$HOME"-based paths.

set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.claude/skills"
SKILLS=(brand design-system frontend-design ui-styling ui-ux-pro-max)

mkdir -p "$DEST"

for skill in "${SKILLS[@]}"; do
    if [ ! -d "$SRC/$skill" ]; then
        echo "skip $skill (not found in $SRC)" >&2
        continue
    fi

    rm -rf "${DEST:?}/$skill"
    cp -r "$SRC/$skill" "$DEST/"

    # ui-ux-pro-max documents its search tool as a repo-relative path.
    sed -i 's|"\.claude/skills/'"$skill"'/|"$HOME/.claude/skills/'"$skill"'/|g' \
        "$DEST/$skill/SKILL.md"

    # The other skills document bare "node scripts/x" / "python scripts/x",
    # which only resolve when the working directory is the skill directory.
    sed -i -E 's|^(node\|python3?) scripts/(\S+)|\1 "$HOME/.claude/skills/'"$skill"'/scripts/\2"|' \
        "$DEST/$skill/SKILL.md"

    echo "installed $skill"
done

echo
echo "Done. Skills are active in the next session."
