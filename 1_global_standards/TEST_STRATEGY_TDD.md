# TDD & Coverage
- All changes follow: Red -> Green -> Refactor -> Document.
- Coverage: backend 100%, frontend 95%, shared 90% (min).
- Reject untested public APIs; test names must map to functions/classes.
- Mutation testing target: >= 75% kill rate (PR reports).

## Timeout Mocking Guidelines

### MANDATORY: Proper Timeout Handling in Tests

**Problem**: Tests that use `setTimeout`, `setInterval`, or async operations with delays can hang indefinitely if not properly mocked, causing test timeouts and CI failures.

**Solution**: Always mock time-based operations in tests while preserving real business logic validation.

### Rules

1. **Mock Async Delays, Not Business Logic**
   - ✅ **DO**: Mock `setTimeout`, `setInterval`, `Promise.delay`, and similar timing functions
   - ✅ **DO**: Use test framework timers (Vitest `vi.useFakeTimers()`, Jest `jest.useFakeTimers()`)
   - ❌ **DON'T**: Mock away actual business validation, error handling, or data transformation logic
   - ❌ **DON'T**: Skip validation of async behavior - test that async operations complete correctly

2. **Test Framework Timer Control**
   ```typescript
   // ✅ CORRECT: Use fake timers for controlled async testing
   import { vi } from 'vitest';
   
   beforeEach(() => {
     vi.useFakeTimers();
   });
   
   afterEach(() => {
     vi.useRealTimers();
   });
   
   it('should handle async operation', async () => {
     const promise = asyncOperation();
     vi.advanceTimersByTime(1000); // Fast-forward time
     await promise;
     // Assert business logic
   });
   ```

3. **Mock External API Delays**
   ```typescript
   // ✅ CORRECT: Mock API client to return immediately, test business logic
   const mockClient = {
     search: vi.fn().mockResolvedValue({ results: [] }), // No delay
   };
   
   // ❌ WRONG: Adding real delays in tests
   const mockClient = {
     search: vi.fn().mockImplementation(() => 
       new Promise(resolve => setTimeout(() => resolve({ results: [] }), 1000))
     ),
   };
   ```

4. **Stream/Event-Based Operations**
   ```typescript
   // ✅ CORRECT: Mock stream events to fire immediately
   const mockStream = {
     on: vi.fn((event, callback) => {
       if (event === 'data') {
         // Fire immediately, don't wait
         callback({ data: 'test' });
       }
       if (event === 'end') {
         callback();
       }
       return mockStream;
     }),
   };
   
   // ❌ WRONG: Using setTimeout in stream mocks
   const mockStream = {
     on: vi.fn((event, callback) => {
       if (event === 'data') {
         setTimeout(() => callback({ data: 'test' }), 100); // Can hang!
       }
       return mockStream;
     }),
   };
   ```

5. **Test Timeout Configuration**
   - Default test timeout: 5 seconds (Vitest default)
   - For complex integration tests: Increase timeout explicitly with `it('test', async () => {...}, 30000)`
   - If a test needs >30 seconds, reconsider the test design - likely needs better mocking

6. **Promise Resolution**
   - ✅ **DO**: Use `mockResolvedValue()` or `mockResolvedValueOnce()` for immediate resolution
   - ✅ **DO**: Use `mockRejectedValue()` for error cases
   - ❌ **DON'T**: Create promises with `new Promise()` that might not resolve

7. **Mock Response Structure Matching**
   - ✅ **DO**: Ensure mock response structures exactly match what the implementation expects
   - ✅ **DO**: Check implementation code to verify expected property names (e.g., `userList` vs `audience`)
   - ❌ **DON'T**: Assume response structure - verify against actual implementation
   - **Example**: If implementation expects `response.results[0].userList`, mock must return `{ results: [{ userList: {...} }] }`
   - **Root Cause**: Mismatched structures cause `undefined` access, leading to errors that may not be properly caught, causing test hangs

8. **Promise Resolution Guarantees**
   - ✅ **DO**: Always ensure mocked promises resolve or reject (never leave promises pending)
   - ✅ **DO**: Use `mockResolvedValue()` for success cases
   - ✅ **DO**: Use `mockRejectedValue()` for error cases
   - ❌ **DON'T**: Create promises that might not resolve (e.g., conditional resolution without guarantee)
   - **Pattern**: Every `await` in test code must have a corresponding mock that resolves/rejects

9. **Verification Checklist**
   - [ ] All async operations in tests resolve/reject immediately (no real delays)
   - [ ] Stream/event emitters fire callbacks synchronously in tests
   - [ ] Test timeouts are appropriate (default 5s, max 30s for integration)
   - [ ] Business logic validation still occurs (not mocked away)
   - [ ] Error handling paths are tested with mocked failures
   - [ ] Mock response structures match implementation expectations (verify property names)
   - [ ] All promises in test code have guaranteed resolution/rejection paths
   - [ ] No conditional promise resolution without fallback

### Examples

**Good Test Pattern:**
```typescript
it('should process keywords', async () => {
  // Mock returns immediately - no delay
  const mockClient = {
    search: vi.fn().mockResolvedValue({
      results: [{ keyword: { text: 'test' } }],
    }),
  };
  
  // Business logic executes immediately
  const result = await executeKeywordList(args, mockClient, registry, logger);
  
  // Validate business logic
  expect(result.keywords).toHaveLength(1);
  expect(result.keywords[0].text).toBe('test');
});
```

**Bad Test Pattern:**
```typescript
it('should process keywords', async () => {
  // ❌ Real delay - can cause timeout
  const mockClient = {
    search: vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ results: [] }), 2000))
    ),
  };
  
  // Test may timeout waiting for delay
  const result = await executeKeywordList(args, mockClient, registry, logger);
});
```

**Common Pitfall - Response Structure Mismatch:**
```typescript
// ❌ WRONG: Mock returns 'audience' but implementation expects 'userList'
it('should get audience', async () => {
  const mockClient = {
    search: vi.fn().mockResolvedValue({
      results: [{ audience: { id: '123' } }], // Wrong property name!
    }),
  };
  // Implementation expects: response.results[0].userList
  // This causes undefined access and potential hang
  const result = await executeAudienceGet(args, mockClient, registry, logger);
});

// ✅ CORRECT: Match implementation expectations
it('should get audience', async () => {
  const mockClient = {
    search: vi.fn().mockResolvedValue({
      results: [{ userList: { id: '123' } }], // Matches implementation
    }),
  };
  const result = await executeAudienceGet(args, mockClient, registry, logger);
});
```

### Hanging Test Prevention Pattern

**Root Cause Analysis**: Tests hang when:
1. Mock response structures don't match implementation expectations
2. Code accesses `undefined` properties (e.g., `response.results[0].campaignBudget` when mock returns `budget`)
3. This causes unhandled promise rejections or infinite loops
4. Test framework waits indefinitely for resolution

**Prevention Checklist** (MANDATORY before writing tests):

1. **Verify Implementation Structure First**
   ```typescript
   // ✅ CORRECT: Check implementation before writing test
   // Implementation expects: response.results[0].campaignBudget
   // So mock MUST return: { results: [{ campaignBudget: {...} }] }
   
   // ❌ WRONG: Assuming structure without checking
   // Mock returns: { results: [{ budget: {...} }] } // Wrong property name!
   ```

2. **Use Type Definitions as Source of Truth**
   ```typescript
   // ✅ CORRECT: Use implementation type definitions
   const mockResponse: {
     results?: Array<{
       campaignBudget?: { id?: string; name?: string };
     }>;
   } = {
     results: [{ campaignBudget: { id: "123", name: "Test" } }],
   };
   ```

3. **Verify Mock Structure Matches Implementation**
   ```typescript
   // ✅ CORRECT: Explicitly verify structure
   it('should list budgets', async () => {
     // Implementation code: r.campaignBudget (line 4173 in tools.ts)
     const mockGoogleAdsClient = {
       search: vi.fn().mockResolvedValue({
         results: [{ campaignBudget: { id: "123" } }], // Matches implementation
       }),
     };
   });
   ```

4. **Common Property Name Mismatches**:
   - `campaignBudget` vs `budget` ❌
   - `userList` vs `audience` ❌
   - `adGroupCriterion` vs `keyword` ❌
   - `biddingStrategy` vs `strategy` ❌

5. **Pre-Test Verification Pattern**:
   ```typescript
   // Before writing test, verify:
   // 1. Search implementation for property access (e.g., grep for "campaignBudget")
   // 2. Check what the implementation expects: response.results[0].campaignBudget
   // 3. Ensure mock returns exactly that structure
   // 4. Run test immediately to catch structure mismatches early
   ```

### Enforcement

- Pre-commit hooks should flag tests with real `setTimeout`/`setInterval` calls
- CI should fail tests that exceed timeout thresholds
- Code review should verify async mocking patterns
- **NEW**: Code review must verify mock response structures match implementation (grep implementation for property names)

