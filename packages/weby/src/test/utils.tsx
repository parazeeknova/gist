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

// Named wrapper component for React Query
interface QueryClientWrapperProps {
  children: ReactNode;
}

const QueryClientWrapper = ({ children }: QueryClientWrapperProps) => {
  const testQueryClient = createTestQueryClient();
  return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
};

// Factory function that returns the wrapper component
export const createWrapper = () => QueryClientWrapper;

// Custom render with QueryClient
export const renderWithQuery = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: QueryClientWrapper,
  });
