// Mock data factories for tests

/**
 * Create mock data for tests
 * This will be expanded as we implement the actual modules
 */

export function createMockConfig(): {
  profiles: {
    default: {
      ga4: { scopes: string[] };
      gtm: { scopes: string[] };
      ads: { developer_token: string };
    };
  };
} {
  return {
    profiles: {
      default: {
        ga4: {
          scopes: [],
        },
        gtm: {
          scopes: [],
        },
        ads: {
          developer_token: "test-token",
        },
      },
    },
  };
}
