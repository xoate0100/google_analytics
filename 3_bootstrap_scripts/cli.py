#!/usr/bin/env python3
import os
import sys
import subprocess

cmd = sys.argv[1] if len(sys.argv) > 1 else "help"

if cmd == "init":
    subprocess.check_call(["python3", "3_bootstrap_scripts/init_project.py"])
elif cmd == "validate":
    subprocess.check_call(["pre-commit", "run", "--all-files"])
elif cmd == "trace":
    subprocess.check_call(["python3", "3_bootstrap_scripts/traceability_graph.py"])
elif cmd == "review":
    subprocess.check_call(["python3", "3_bootstrap_scripts/ai_review.py"])
elif cmd == "commit-checkpoint":
    subprocess.check_call(["bash", "scripts/commit_checkpoint.sh"])
elif cmd == "sync":
    # Sync from project-initializer (meta-framework upstream). URL from env or first arg.
    url = os.environ.get("META_FRAMEWORK_UPSTREAM") or os.environ.get("PROJECT_INITIALIZER_REPO") or (sys.argv[2] if len(sys.argv) > 2 else None)
    if not url:
        print("usage: META_FRAMEWORK_UPSTREAM=<url> python3 3_bootstrap_scripts/cli.py sync")
        print("   or: python3 3_bootstrap_scripts/cli.py sync <project-initializer-git-url>")
        print("See docs/META_FRAMEWORK_SYNC.md")
        sys.exit(1)
    script = os.path.join(os.path.dirname(__file__), "..", "scripts", "sync_from_project_initializer.sh")
    subprocess.check_call(["bash", script, url])
else:
    print("usage: python3 3_bootstrap_scripts/cli.py [init|validate|trace|review|commit-checkpoint|sync]")
    print("\nCommands:")
    print("  init      - Initialize project from MVP_SPECIFICATION.yaml")
    print("  validate  - Run all pre-commit hooks")
    print("  trace     - Generate traceability graph")
    print("  review    - Run AI review")
    print("  commit-checkpoint - Commit with validation and proper message format")
    print("  sync      - Pull latest from project-initializer and prepare dev environment")
