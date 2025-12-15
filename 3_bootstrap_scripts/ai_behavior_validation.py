#!/usr/bin/env python3
import sys, re, subprocess

# Ensure commit message(s) in staging include plan/component/task tags
def get_staged_commit_msg_template():
    # Pre-commit runs before commit object exists; validate COMMIT_MSG file if present,
    # otherwise allow; PR checks will re-validate.
    return None

# Validate changed files are within allowed paths (feature_flags.yml is source of truth).
try:
    import yaml
except ImportError:
    print("[ai-guard] Warning: PyYAML not installed. Install with: pip install PyYAML")
    sys.exit(0)

import pathlib
flags = yaml.safe_load(open("0_phase0_bootstrap/feature_flags.yml"))
allowed = set(flags["permissions"]["write_to"])

changed = subprocess.check_output(["git","diff","--cached","--name-only"], text=True).splitlines()
viol = []
for f in changed:
    p = pathlib.Path(f)
    # Normalize path separators for cross-platform compatibility (git always uses /)
    # Convert to POSIX path format for consistent comparison
    f_normalized = p.as_posix()
    allowed_normalized = [pathlib.Path(a).as_posix() for a in allowed]

    if not any(f_normalized.startswith(a) for a in allowed_normalized):
        # allow root files like README.md
        if p.name in ("README.md",".pre-commit-config.yaml"): continue
        viol.append(f)

if viol:
    print("[ai-guard] Write outside allowed paths:", *viol, sep="\n- ")
    sys.exit(1)

print("[ai-guard] OK")
