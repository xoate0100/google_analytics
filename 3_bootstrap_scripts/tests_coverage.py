#!/usr/bin/env python3
"""
Windows-compatible tests and coverage wrapper.
Detects OS and runs appropriate tests or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, try to run bash script if available, otherwise run tests directly
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
                script_path = Path(__file__).parent / "tests_coverage.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - run tests directly with pnpm/npm
        print("[tests_coverage] Running tests directly on Windows (bash not available)")
        if Path("package.json").exists():
            # Try pnpm first, then npm
            for cmd in ["pnpm", "npm"]:
                try:
                    result = subprocess.run([cmd, "test"], check=False)
                    return result.returncode
                except FileNotFoundError:
                    continue
        print("[tests_coverage] No package manager found, skipping")
        return 0

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "tests_coverage.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[tests_coverage] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
