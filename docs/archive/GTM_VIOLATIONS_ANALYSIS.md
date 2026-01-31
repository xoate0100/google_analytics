<!-- DEPRECATED: Archived for reference. See docs/archive/README.md. Current context: 6_ai_runtime_context/ACTIVE_PLAN.yaml -->

# GTM Violations Analysis

**Date**: 2024-01-17  
**Task**: T.3.4 - Fix GTM violations  
**Status**: IN PROGRESS

## Executive Summary

After architecture checker fix, **34 actual SRP violations** found in `src/gtm/tools.ts` (not 10 as originally reported - the original 10 were false positives from variable assignments).

## Violations Found

All violations are in `register*Tool` functions that contain large schema definitions:

1. `registerGTMTools` (Line 115) - 135 lines
2. `registerContainerListTool` (Line 250) - 128 lines
3. `registerContainerGetTool` (Line 378) - 138 lines
4. `registerContainerUpsertTool` (Line 516) - 142 lines
5. `registerContainerDeleteTool` (Line 658) - 106 lines
6. `registerWorkspaceListTool` (Line 764) - 128 lines
7. `registerWorkspaceGetTool` (Line 892) - 117 lines
8. `registerWorkspaceCreateTool` (Line 1009) - 150 lines
9. `registerWorkspaceMergeTool` (Line 1159) - 110 lines
10. `registerTagListTool` (Line 1269) - 128 lines
11. `registerTagGetTool` (Line 1397) - 138 lines
12. `registerTagUpsertTool` (Line 1535) - 146 lines
13. `registerTagDeleteTool` (Line 1681) - 106 lines
14. `registerTriggerListTool` (Line 1787) - 128 lines
15. `registerTriggerGetTool` (Line 1915) - 135 lines
16. `registerTriggerUpsertTool` (Line 2050) - 138 lines
17. `registerTriggerDeleteTool` (Line 2188) - 106 lines
18. `registerVariableListTool` (Line 2294) - 128 lines
19. `registerVariableGetTool` (Line 2422) - 132 lines
20. `registerVariableUpsertTool` (Line 2554) - 134 lines
21. `registerVariableDeleteTool` (Line 2688) - 106 lines
22. `registerBuiltinVariableListTool` (Line 2794) - 97 lines
23. `registerBuiltinVariableEnableTool` (Line 2891) - 146 lines
24. `registerDataLayerValidateTool` (Line 3037) - 147 lines
25. `registerDataLayerSchemaGenerateTool` (Line 3184) - 93 lines
26. `registerDataLayerMonitorTool` (Line 3277) - 151 lines
27. `registerDataLayerEventsListTool` (Line 3428) - 99 lines
28. `registerFolderListTool` (Line 3527) - 96 lines
29. `registerFolderGetTool` (Line 3623) - 114 lines
30. `registerFolderUpsertTool` (Line 3737) - 106 lines
31. `registerFolderDeleteTool` (Line 3843) - 101 lines
32. `registerVersionListTool` (Line 3944) - 96 lines
33. `registerVersionGetTool` (Line 4040) - 103 lines
34. `registerVersionCreateTool` (Line 4143) - 110 lines
35. `registerVersionRestoreTool` (Line 4253) - 113 lines
36. `registerWorkspacePublishTool` (Line 4366) - 136 lines
37. `registerPreviewCreateTool` (Line 4502) - 102 lines
38. `registerPreviewGetTool` (Line 4604) - 136 lines
39. `registerConsentConfigureTool` (Line 4740) - 148 lines
40. `registerConsentGetTool` (Line 4888) - 147 lines
41. `registerTagSequenceUpdateTool` (Line 5035) - 156 lines

**Total GTM Violations**: 41 violations

## Root Cause

The `register*Tool` functions contain large `inputSchema` definitions that make them exceed 50 lines. These schema definitions are necessary for the MCP server tool registration, but can be extracted to separate constants to reduce function size.

## Refactoring Strategy

### Option 1: Extract Schema Definitions to Constants (Recommended)
- Create a `schemas.ts` file or similar to store schema definitions
- Extract `inputSchema` objects to constants
- Reference constants in `register*Tool` functions
- **Pros**: Clean separation, reusable schemas
- **Cons**: More files to maintain

### Option 2: Extract Handler Functions
- Extract the `handler` async function to separate functions
- Keep schemas inline but move handler logic out
- **Pros**: Simpler, less file changes
- **Cons**: Still have large schema definitions

### Option 3: Group Registration Functions
- For `registerGTMTools`, break into smaller groups (e.g., `registerContainerTools`, `registerWorkspaceTools`)
- **Pros**: Reduces main function size
- **Cons**: Doesn't solve individual tool registration violations

## Recommended Approach

**Hybrid Approach**:
1. Extract schema definitions to constants (Option 1)
2. Extract handler functions (Option 2)
3. Group registration calls in `registerGTMTools` (Option 3)

This will reduce all functions to ≤50 lines while maintaining code clarity.

## Next Steps

1. Create schema constants file for GTM tools
2. Extract schemas from register functions
3. Extract handler functions
4. Refactor `registerGTMTools` to use grouped registration functions
5. Verify all functions ≤50 lines
