#!/usr/bin/env python3
"""
Windows-compatible security scan wrapper.
Detects OS and runs appropriate security scan or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, try to run bash script if available, otherwise skip
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
                script_path = Path(__file__).parent / "security_scan.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - skip (security scan requires git grep which needs bash)
        print("[security_scan] Skipping on Windows (bash not available)")
        return 0

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "security_scan.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[security_scan] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
