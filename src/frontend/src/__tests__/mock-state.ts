import type { backendInterface } from "@/backend";
import { vi } from "vitest";

/**
 * Mutable state that drives the mocked `@caffeineai/core-infrastructure` hooks.
 *
 * The state lives on `globalThis` (not module scope) so that both the test files
 * and the mock module share the exact same object regardless of how `vi.mock`
 * evaluates the test-utils module (which can produce a separate module instance
 * with its own module-level state).
 */
interface MockState {
  isAuthenticated: boolean;
  actor: Partial<backendInterface> | null;
}

const g = globalThis as unknown as { __lpmMockState?: MockState };
g.__lpmMockState = g.__lpmMockState ?? {
  isAuthenticated: false,
  actor: null,
};

export const mockState: MockState = g.__lpmMockState;

export function setAuthenticated(value: boolean) {
  mockState.isAuthenticated = value;
}

export function setActor(actor: Partial<backendInterface> | null) {
  mockState.actor = actor;
}

/**
 * Builds a full mock actor with default no-op/empty implementations so pages
 * render without trapping, letting each test override only the methods it
 * cares about.
 */
export function createMockActor(
  overrides: Partial<backendInterface> = {},
): Partial<backendInterface> {
  return {
    listPools: vi.fn(async () => []),
    listTrackedPools: vi.fn(async () => []),
    listAllocations: vi.fn(async () => []),
    listNotifications: vi.fn(async () => []),
    listRebalanceHistory: vi.fn(async () => []),
    getPreferences: vi.fn(async () => ({
      liquidityRemoved: true,
      liquidityWithdrawn: true,
      impermanentLossRisk: true,
      emailDelivery: false,
    })),
    listCredentials: vi.fn(async () => []),
    addTrackedPool: vi.fn(async () => undefined),
    setTarget: vi.fn(async () => undefined),
    rebalance: vi.fn(async () => ({ id: 0n, at: 0n, changes: [] })),
    markRead: vi.fn(async () => undefined),
    updatePreferences: vi.fn(async () => undefined),
    addCredential: vi.fn(async () => undefined),
    updateCredential: vi.fn(async () => undefined),
    removeCredential: vi.fn(async () => undefined),
    refreshPools: vi.fn(async () => undefined),
    ...overrides,
  };
}
