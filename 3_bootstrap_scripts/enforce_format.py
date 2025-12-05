#!/usr/bin/env python3
"""
Windows-compatible format enforcement wrapper.
Detects OS and runs appropriate formatting or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, formatting is handled by prettier/eslint via package.json scripts
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
                script_path = Path(__file__).parent / "enforce_format.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - skip (formatting handled by prettier/eslint)
        print("[enforce_format] Skipping on Windows (bash not available, formatting handled by prettier/eslint)")
        return 0

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "enforce_format.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[enforce_format] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
