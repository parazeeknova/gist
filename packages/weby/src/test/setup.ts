import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
Object.defineProperty(global, "import", {
  value: {
    meta: {
      env: {
        VITE_GITHUB_USERNAME: "testuser",
      },
    },
  },
  writable: true,
});
