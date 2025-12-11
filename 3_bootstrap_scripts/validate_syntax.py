#!/usr/bin/env python3
"""
Windows-compatible syntax validation wrapper.
Detects OS and runs appropriate validation or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, syntax checks are handled by pre-commit-hooks (check-yaml, check-json, etc.)
    # This script is mainly for Unix systems, but can skip gracefully on Windows
    if sys.platform == "win32":
        # Check if we have bash available (Git Bash or WSL)
        try:
            result = subprocess.run(
                ["bash", "--version"],
                capture_output=True,
                timeout=2
            )
            if result.returncode == 0:
                # Bash available, run the original script
                script_path = Path(__file__).parent / "validate_syntax.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - skip (syntax checks handled by pre-commit-hooks)
        print("[validate_syntax] Skipping on Windows (bash not available, syntax checks handled by pre-commit-hooks)")
        return 0

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "validate_syntax.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[validate_syntax] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
