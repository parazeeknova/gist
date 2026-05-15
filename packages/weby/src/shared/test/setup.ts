import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage (zustand persist middleware requires it)
Object.defineProperty(globalThis, "localStorage", {
  value: {
    clear: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
  writable: true,
});

// Mock fetch globally
Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(),
  writable: true,
});

// Mock IntersectionObserver globally
const MockIntersectionObserver = vi.fn();
MockIntersectionObserver.prototype = {
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
};
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// Mock environment variables
vi.stubEnv("VITE_GITHUB_USERNAME", "testuser");
