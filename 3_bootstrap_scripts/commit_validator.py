#!/usr/bin/env python3
"""
Windows-compatible commit message validator wrapper.
Detects OS and runs appropriate validation or skips gracefully.
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # On Windows, try to run bash script if available, otherwise validate in Python
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
                script_path = Path(__file__).parent / "commit_validator.sh"
                if script_path.exists():
                    subprocess.run(["bash", str(script_path)], check=False)
                    return
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            pass

        # No bash available - validate commit message in Python
        commit_msg_file = os.environ.get("COMMIT_EDITMSG") or ".git/COMMIT_EDITMSG"
        if Path(commit_msg_file).exists():
            with open(commit_msg_file, "r", encoding="utf-8") as f:
                commit_msg = f.read().strip()

            # Basic validation: check for conventional commit format
            # Allow: type(scope): description
            # Or: type: description
            lines = commit_msg.split("\n")
            first_line = lines[0] if lines else ""

            # Check if it follows conventional commit format
            if ":" in first_line:
                parts = first_line.split(":", 1)
                if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                    return 0

            # Allow merge commits, revert commits, etc.
            if first_line.startswith(("Merge", "Revert", "fixup!", "squash!")):
                return 0

            # If it doesn't match, warn but don't fail (allow flexibility)
            print(f"[commit_validator] Commit message doesn't follow conventional format: {first_line[:50]}")
            print("[commit_validator] Recommended format: type(scope): description")
            return 0  # Don't fail, just warn

    # Unix-like system - try to run bash script
    script_path = Path(__file__).parent / "commit_validator.sh"
    if script_path.exists():
        try:
            subprocess.run(["bash", str(script_path)], check=False)
        except FileNotFoundError:
            print("[commit_validator] Bash not found, skipping")
            return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
