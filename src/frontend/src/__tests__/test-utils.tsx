import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { mockState } from "./mock-state";

export {
  mockState,
  setAuthenticated,
  setActor,
  createMockActor,
} from "./mock-state";

/** Mock of `useInternetIdentity` — the seam the router uses for login gating. */
export function useInternetIdentity() {
  return {
    isAuthenticated: mockState.isAuthenticated,
    login: vi.fn(),
    clear: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
    isLoginIdle: true,
    isLoginSuccess: false,
    isLoginError: false,
    loginStatus: "idle" as const,
  };
}

/** Mock of `useActor` — returns the typed local actor mock the hooks call. */
export function useActor() {
  return { actor: mockState.actor, isFetching: false };
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
