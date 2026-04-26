import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

// Create a test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
        staleTime: 0,
      },
    },
  });

// Wrapper for React Query
// eslint-disable-next-line react/display-name
export const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  );
};

// Custom render with QueryClient
export const renderWithQuery = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    ),
  });
};
