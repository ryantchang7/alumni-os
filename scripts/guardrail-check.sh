#!/bin/bash
# Guards the Heritage contrast fixes from silently regressing. These three
# patterns fail AA contrast (~3-3.5:1) and were swept out of src/ in the
# Phase 3 token codemod — text-ink-muted / eyebrow+text-gold replaced them.
# Run before committing: ./scripts/guardrail-check.sh
set -e
cd "$(dirname "$0")/.."

FAIL=0

check() {
  local pattern="$1"
  local label="$2"
  local hits
  hits=$(grep -rn "$pattern" src --include="*.tsx" --include="*.ts" || true)
  if [ -n "$hits" ]; then
    echo "GUARDRAIL FAIL: $label reappeared:"
    echo "$hits"
    echo
    FAIL=1
  fi
}

check 'text-\[#8a7f70\]' 'text-[#8a7f70] (use text-ink-muted for text; the raw hex stays valid for borders/hairlines only)'
check 'text-white/35' 'text-white/35 (use eyebrow + text-gold)'
check 'text-white/45' 'text-white/45 (use eyebrow + text-gold for labels, or bump body copy to /60+)'

if [ "$FAIL" -eq 1 ]; then
  echo "Guardrail check failed — see above."
  exit 1
fi
echo "Guardrail check passed — no failing-contrast patterns found."
