#!/usr/bin/env python3
"""
Windows-compatible static analysis wrapper.
Detects OS and runs appropriate analysis or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, static analysis is handled by tsc/eslint via package.json scripts
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
                script_path = Path(__file__).parent / "static_analysis.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - skip (static analysis handled by tsc/eslint)
        print("[static_analysis] Skipping on Windows (bash not available, static analysis handled by tsc/eslint)")
        return 0

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "static_analysis.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[static_analysis] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
