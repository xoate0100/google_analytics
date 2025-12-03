#!/usr/bin/env python3
import sys, re, pathlib

try:
    import yaml
except ImportError:
    print("[architecture] Error: PyYAML not installed. Install with: pip install PyYAML")
    sys.exit(1)

# Load rules and feature flags
rules_path = pathlib.Path("5_reference_architectures/LAYER_RULES.yaml")
if rules_path.exists():
    RULES = yaml.safe_load(open(rules_path))
else:
    RULES = {"components": {}, "rules": {}, "layers": []}

flags_path = pathlib.Path("0_phase0_bootstrap/feature_flags.yml")
enforce_solid = False
if flags_path.exists():
    try:
        flags = yaml.safe_load(open(flags_path))
        enforce_solid = flags.get("ai_guardrails", {}).get("enforce_solid_principles", False)
    except:
        pass

violations = []

def check_cross_component_imports():
    # Simple heuristic: forbid strings like "from backend" inside frontend, etc.
    for comp, cfg in RULES["components"].items():
        forbid = cfg.get("forbid_import", [])
        dirs = {"frontend":"frontend", "backend":"backend", "shared":"shared"}
        root = pathlib.Path(dirs.get(comp, ""))
        if not root or not root.exists(): continue
        extensions = [".ts", ".tsx", ".js", ".py", ".java", ".cs"]
        for p in root.rglob("*"):
            if p.suffix not in extensions:
                continue
            try:
                text = p.read_text(encoding="utf-8", errors="ignore")
            except:
                continue
            for bad in forbid:
                if re.search(rf'\bfrom\s+{bad}\b|\brequire\(["\']{bad}', text):
                    violations.append(f"{p}: illegal import of {bad} in {comp}")

def check_layer_rules():
    # Minimal: forbid 'db' keyword in api/domain layers (heuristic)
    forbid = set(RULES.get("rules", {}).get("forbid_db_calls_from", []))
    for layer_def in RULES.get("layers", []):
        layer_name = layer_def.get("name", "") if isinstance(layer_def, dict) else layer_def
        if layer_name not in forbid:
            continue
        root = pathlib.Path(f"backend/src/{layer_name}")
        if not root.exists(): continue
        for p in root.rglob("*.py"):
            t = p.read_text(encoding="utf-8", errors="ignore")
            if re.search(r'\b(sql|cursor|Session|insert|update|delete)\b', t):
                violations.append(f"{p}: DB-like access in {layer_name} layer")

def is_arrow_function_assignment(line, next_lines=None):
    """
    Determine if a line with const/let/var assignment is actually an arrow function.
    Returns True if it's an arrow function, False if it's a variable assignment to a function call result.

    Edge cases handled:
    - const x = (await ...) -> False (function call result)
    - const x = (...) -> False (function call result)
    - const x = () => {} -> True (arrow function)
    - const x = async () => {} -> True (arrow function)
    - const x: Type = () => {} -> True (arrow function with type annotation)
    - Multi-line arrow functions (=> appears on same or next line)
    """
    # Must have => to be an arrow function
    # Check current line and next 3 lines for => (handles multi-line declarations)
    search_lines = [line]
    if next_lines:
        search_lines.extend(next_lines[:3])

    combined = ' '.join(search_lines)

    # If => is present, it's likely an arrow function
    if '=>' in combined:
        # Exclude cases where => is part of a comparison (x => y) or template literal
        # Pattern: const x = (await ...) should NOT match
        # Pattern: const x = () => {} should match
        arrow_pos = combined.find('=>')
        if arrow_pos > 0:
            before_arrow = combined[:arrow_pos].strip()
            # If we see await or new before =>, it's likely a function call, not arrow function
            if re.search(r'\b(await|new)\s+', before_arrow):
                return False
            # If we see a closing paren right before => without opening paren for params, it's likely not arrow
            # But () => is valid, so we need to be careful
            # Simple: if => appears and it's not in a string/template, and pattern matches arrow function, it's one
            if re.search(r'=\s*(async\s+)?\([^)]*\)\s*=>', combined):
                return True
            # Also handle: const x = async () => or const x = () =>
            if re.search(r'=\s*(async\s+)?\([^)]*\)\s*=>', combined):
                return True
            # Single param: const x = param => or const x = (param) =>
            if re.search(r'=\s*(async\s+)?\w+\s*=>', combined) or re.search(r'=\s*(async\s+)?\(\s*\w+\s*\)\s*=>', combined):
                return True
    return False

def is_function_declaration(line):
    """
    Check if a line is a function declaration (not a variable assignment).
    Handles: function name(), export function name(), async function name()
    """
    # Explicit function declaration
    if re.match(r'^\s*(export\s+)?(async\s+)?function\s+\w+\s*\(', line):
        return True
    return False

def is_arrow_function_declaration(line, next_lines=None):
    """
    Check if a line declares an arrow function (const/let/var = () => or = async () =>).
    Excludes variable assignments to function call results.
    """
    # Pattern: const/let/var name [:Type] = (async)? () =>
    if re.match(r'^\s*(export\s+)?(const|let|var)\s+\w+(\s*[:=]\s*[^=]*)?\s*=\s*(async\s+)?\(', line):
        return is_arrow_function_assignment(line, next_lines)
    return False

def count_balanced_braces(lines, start_idx, initial_brace_count=0):
    """
    Count braces to find where a function/block ends.
    Returns (end_line_idx, final_brace_count) where brace_count reaches 0.
    Handles nested braces properly. Only tracks braces (not parens/brackets) for function bodies.
    """
    brace_count = initial_brace_count

    for i in range(start_idx, len(lines)):
        line = lines[i]
        # Track braces for function body
        brace_count += line.count('{') - line.count('}')

        # Function body ends when braces balance (we've closed the opening brace)
        if brace_count == 0 and i > start_idx:
            return i, 0

    # If we never balanced, function goes to end of file
    return len(lines) - 1, brace_count

def check_srp_single_responsibility():
    """
    SRP: Flag functions > 50 lines

    Improved to handle:
    - Variable assignments vs function declarations (excludes const x = (await ...))
    - Nested function declarations
    - Multi-line function declarations
    - Proper brace counting with nesting awareness
    - Type annotations in TypeScript
    """
    if not enforce_solid:
        return

    code_extensions = [".py", ".ts", ".tsx", ".js"]
    # Check actual project structure: src/ is the main codebase
    search_dirs = [
        pathlib.Path("src"),      # Main source code (ga4/, gtm/, ads/, core/, server/)
        pathlib.Path("frontend"), # Frontend (if exists)
        pathlib.Path("backend"),  # Backend (if exists)
        pathlib.Path("shared")    # Shared (if exists)
    ]

    for root_dir in search_dirs:
        if not root_dir.exists():
            continue

        for file_path in root_dir.rglob("*"):
            if file_path.suffix not in code_extensions:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                # Track all functions we've found
                functions = []  # List of (start_line, name, is_nested, length, end_line)
                i = 0

                while i < len(lines):
                    line = lines[i].strip()
                    next_lines = lines[i+1:i+4] if i+1 < len(lines) else []

                    # Detect function start (Python)
                    if file_path.suffix == ".py":
                        if re.match(r'^\s*(def|async def)\s+\w+', lines[i]):
                            # Find function end (next def/class or end of file)
                            function_start = i + 1  # 1-indexed
                            function_name = re.search(r'(def|async def)\s+(\w+)', lines[i]).group(2)

                            # Find where this function ends
                            j = i + 1
                            while j < len(lines):
                                # Function ends at next def/class at same or outer indentation
                                if re.match(r'^\s*(def|class|async def)', lines[j]):
                                    # Check indentation
                                    current_indent = len(lines[i]) - len(lines[i].lstrip())
                                    next_indent = len(lines[j]) - len(lines[j].lstrip())
                                    if next_indent <= current_indent:
                                        # Next function/class at same or outer level
                                        function_end = j
                                        function_length = function_end - function_start + 1
                                        if function_length > 50:
                                            functions.append((function_start, function_name, False, function_length, function_end))
                                        i = j - 1  # Will be incremented at end of loop
                                        break
                                j += 1
                            else:
                                # Function goes to end of file
                                function_end = len(lines)
                                function_length = function_end - function_start + 1
                                if function_length > 50:
                                    functions.append((function_start, function_name, False, function_length, function_end))
                                break

                    # Detect function start (TypeScript/JavaScript)
                    else:
                        # Check for explicit function declaration
                        if is_function_declaration(lines[i]):
                            function_start = i + 1  # 1-indexed
                            match = re.search(r'function\s+(\w+)', lines[i])
                            function_name = match.group(1) if match else "anonymous"

                            # Find function body start and end
                            # Function signature might have opening brace on same line or next line
                            brace_count = 0
                            opening_brace_line = None
                            j = i

                            # Search for opening brace (could be on same line or next few lines)
                            while j < len(lines) and j < i + 10:  # Limit search to 10 lines
                                brace_count += lines[j].count('{') - lines[j].count('}')
                                if brace_count > 0:
                                    opening_brace_line = j
                                    break
                                j += 1

                            if opening_brace_line is not None:
                                # Found opening brace, now find closing brace
                                # Start counting from the line AFTER the opening brace line
                                # (since we already counted the opening brace in brace_count)
                                end_line, _ = count_balanced_braces(lines, opening_brace_line + 1, brace_count)
                                function_end = end_line + 1  # 1-indexed (inclusive)
                                function_length = function_end - function_start + 1

                                # Check if this function is nested inside another
                                is_nested = any(f_start < function_start < f_end for f_start, _, _, _, f_end in functions)

                                if function_length > 50:
                                    functions.append((function_start, function_name, is_nested, function_length, function_end))

                                i = end_line
                            else:
                                # No opening brace found - might be function type declaration or malformed, skip
                                i += 1
                                continue

                        # Check for arrow function assignment
                        elif is_arrow_function_declaration(lines[i], next_lines):
                            function_start = i + 1  # 1-indexed
                            match = re.search(r'(?:const|let|var)\s+(\w+)', lines[i])
                            function_name = match.group(1) if match else "anonymous"

                            # Find arrow function body
                            # Arrow functions can be: () => {} or () => expr
                            brace_count = 0
                            paren_count = 0
                            bracket_count = 0
                            found_arrow = False
                            in_function_body = False
                            j = i

                            # Find the => and then the function body
                            while j < len(lines) and j < i + 200:  # Reasonable limit
                                line_content = lines[j]

                                if not found_arrow:
                                    if '=>' in line_content:
                                        found_arrow = True
                                        # After =>, we're in function body
                                        arrow_idx = line_content.find('=>')
                                        after_arrow = line_content[arrow_idx + 2:].strip()
                                        if after_arrow.startswith('{'):
                                            in_function_body = True
                                            brace_count = 1
                                        elif after_arrow and not after_arrow.startswith('//'):
                                            # Single expression, ends at semicolon or newline
                                            in_function_body = True
                                else:
                                    # Track braces to find end of function body
                                    if in_function_body:
                                        brace_count += line_content.count('{') - line_content.count('}')
                                        paren_count += line_content.count('(') - line_content.count(')')
                                        bracket_count += line_content.count('[') - line_content.count(']')

                                        # Function ends when braces balance
                                        if brace_count == 0 and paren_count == 0 and bracket_count == 0:
                                            # Check if line ends with semicolon or next line starts new statement
                                            if (line_content.rstrip().endswith(';') or
                                                (j + 1 < len(lines) and
                                                 re.match(r'^\s*(const|let|var|function|export|import|class|interface|type)', lines[j+1]))):
                                                break
                                    else:
                                        # Single expression arrow function - ends at semicolon or new statement
                                        if (line_content.rstrip().endswith(';') or
                                            (j + 1 < len(lines) and
                                             re.match(r'^\s*(const|let|var|function|export|import|class|interface|type)', lines[j+1]))):
                                            break

                                j += 1

                            if j < len(lines):
                                function_end = j + 1  # 1-indexed (inclusive)
                                function_length = function_end - function_start + 1

                                # Check if nested (function starts inside another function's range)
                                is_nested = any(f_start < function_start < f_end for f_start, _, _, f_end in functions)

                                if function_length > 50:
                                    functions.append((function_start, function_name, is_nested, function_length, function_end))

                                i = j

                    i += 1

                # Report violations (only top-level functions, not nested helpers)
                for function_start, function_name, is_nested, function_length, function_end in functions:
                    # Only report top-level functions (nested functions are often helpers)
                    # But if a nested function is very large (>100 lines), report it too
                    if not is_nested or function_length > 100:
                        violations.append(
                            f"{file_path}:{function_start} SRP violation: "
                            f"Function '{function_name}' is {function_length} lines (>50). "
                            f"Refactor into smaller functions. See 1_global_standards/SOLID_PRINCIPLES.md"
                        )

            except Exception as e:
                # Skip files that can't be parsed
                continue


def check_isp_interface_segregation():
    """ISP: Flag interfaces/types > 10 methods/properties"""
    if not enforce_solid:
        return

    ts_extensions = [".ts", ".tsx"]
    # Check actual project structure: src/ is the main codebase
    search_dirs = [
        pathlib.Path("src"),      # Main source code (TypeScript)
        pathlib.Path("frontend"), # Frontend (if exists)
        pathlib.Path("backend"),  # Backend (if exists)
        pathlib.Path("shared")    # Shared (if exists)
    ]

    for root_dir in search_dirs:
        if not root_dir.exists():
            continue

        for file_path in root_dir.rglob("*"):
            if file_path.suffix not in ts_extensions:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                # Find interface and type definitions
                for i, line in enumerate(lines, 1):
                    # Match interface definitions
                    interface_match = re.search(r'interface\s+(\w+)', line)
                    if interface_match:
                        interface_name = interface_match.group(1)
                        # Count methods/properties in interface
                        brace_count = line.count('{') - line.count('}')
                        method_count = 0
                        j = i

                        while j < len(lines) and brace_count >= 0:
                            current_line = lines[j]
                            brace_count += current_line.count('{') - current_line.count('}')

                            # Count method/property definitions
                            if re.search(r'^\s*\w+.*[:?]\s*[^;]', current_line) or re.search(r'^\s*\w+\s*\(', current_line):
                                method_count += 1

                            if brace_count < 0:
                                break
                            j += 1

                        if method_count > 10:
                            violations.append(
                                f"{file_path}:{i} ISP violation: "
                                f"Interface '{interface_name}' has {method_count} methods/properties (>10). "
                                f"Split into smaller, focused interfaces. See 1_global_standards/SOLID_PRINCIPLES.md"
                            )

                    # Match type definitions (TypeScript)
                    type_match = re.search(r'type\s+(\w+)\s*=\s*\{', line)
                    if type_match:
                        type_name = type_match.group(1)
                        brace_count = line.count('{') - line.count('}')
                        method_count = 0
                        j = i

                        while j < len(lines) and brace_count >= 0:
                            current_line = lines[j]
                            brace_count += current_line.count('{') - current_line.count('}')

                            if re.search(r'^\s*\w+.*[:?]\s*[^;]', current_line):
                                method_count += 1

                            if brace_count < 0:
                                break
                            j += 1

                        if method_count > 10:
                            violations.append(
                                f"{file_path}:{i} ISP violation: "
                                f"Type '{type_name}' has {method_count} properties (>10). "
                                f"Split into smaller, focused types. See 1_global_standards/SOLID_PRINCIPLES.md"
                            )

            except Exception as e:
                # Skip files that can't be parsed
                continue


def check_dip_dependency_inversion():
    """DIP: Flag direct imports of concrete implementations"""
    if not enforce_solid:
        return

    code_extensions = [".py", ".ts", ".tsx"]
    # Check actual project structure: src/ is the main codebase
    search_dirs = [
        pathlib.Path("src"),      # Main source code
        pathlib.Path("frontend"), # Frontend (if exists)
        pathlib.Path("backend"),  # Backend (if exists)
        pathlib.Path("shared")    # Shared (if exists)
    ]

    # Patterns that suggest concrete implementation imports
    concrete_patterns = [
        (r'from\s+[\w.]+\.models\.', "models"),  # Direct model imports
        (r'from\s+[\w.]+\.services\.', "services"),  # Direct service imports
        (r'from\s+[\w.]+\.repositories\.', "repositories"),  # Direct repository imports
        (r'import\s+.*from\s+["\']([\w/]+/)?(models|services|repositories)', "concrete"),  # JS/TS imports
    ]

    for root_dir in search_dirs:
        if not root_dir.exists():
            continue

        for file_path in root_dir.rglob("*"):
            if file_path.suffix not in code_extensions:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                for i, line in enumerate(lines, 1):
                    # Skip if importing from interfaces/abstract
                    if re.search(r'(interfaces|abstract|interfaces/)', line, re.IGNORECASE):
                        continue

                    # Check for concrete imports
                    for pattern, pattern_type in concrete_patterns:
                        match = re.search(pattern, line)
                        if match:
                            # Extract the import path
                            import_match = re.search(r'from\s+["\']?([\w./]+)', line) or re.search(r'import\s+.*from\s+["\']([\w./]+)', line)
                            if import_match:
                                import_path = import_match.group(1)
                                violations.append(
                                    f"{file_path}:{i} DIP violation: "
                                    f"Direct import of concrete implementation '{import_path}'. "
                                    f"Depend on abstractions (interfaces/abstract classes) instead. "
                                    f"See 1_global_standards/SOLID_PRINCIPLES.md"
                                )
                                break  # Only report once per line

            except Exception as e:
                # Skip files that can't be parsed
                continue


# Run all checks
check_cross_component_imports()
check_layer_rules()

if enforce_solid:
    check_srp_single_responsibility()
    check_isp_interface_segregation()
    check_dip_dependency_inversion()

if violations:
    print("[architecture] BLOCKING: Architecture violations detected:")
    print("\n".join(f"  - {v}" for v in violations))
    print("\n[architecture] Fix violations before committing. See 1_global_standards/SOLID_PRINCIPLES.md for guidance.")
    sys.exit(1)

print("[architecture] All checks passed")
