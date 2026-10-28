import "@testing-library/jest-dom/vitest";
import { NotificationType } from "@/backend";
import Dashboard from "@/pages/Dashboard";
import type {
  AllocationView,
  Notification,
  Pool,
  RebalanceRecord,
} from "@/types";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockActor,
  renderWithProviders,
  setActor,
  setAuthenticated,
} from "./test-utils";

vi.mock("@caffeineai/core-infrastructure", () => import("./test-utils"));

const pools: Pool[] = [
  {
    id: "icp-usdc",
    name: "ICP/USDC",
    dex: "ICPSwap",
    apy: 12.5,
    volume24h: 5_000_000,
    fees24h: 15_000,
    tvl: 50_000_000,
    priceVolatility: 0.1,
    compositeScore: 0.85,
  },
];

const allocations: AllocationView[] = [
  {
    poolId: "icp-usdc",
    currentPercent: 40n,
    targetPercent: 60n,
    deviation: 20n,
  },
];

const notifications: Notification[] = [
  {
    id: 1n,
    kind: NotificationType.liquidityRemoved,
    poolId: "icp-usdc",
    at: 1_700_000_000_000_000_000n,
    read: false,
  },
];

const rebalanceHistory: RebalanceRecord[] = [
  {
    id: 0n,
    at: 1_700_000_000_000_000_000n,
    changes: [{ poolId: "icp-usdc", fromPercent: 40n, toPercent: 60n }],
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(
      createMockActor({
        listPools: vi.fn(async () => pools),
        listTrackedPools: vi.fn(async () => [
          { poolId: "icp-usdc", addedAt: 0n },
        ]),
        listAllocations: vi.fn(async () => allocations),
        listNotifications: vi.fn(async () => notifications),
        listRebalanceHistory: vi.fn(async () => rebalanceHistory),
        markRead: vi.fn(async () => undefined),
      }),
    );
  });

  it("shows allocation targets, notifications, and rebalance history", async () => {
    renderWithProviders(<Dashboard />);

    // Allocation target for the tracked pool.
    expect(await screen.findByText("ICP/USDC")).toBeInTheDocument();
    // Notification with unread badge.
    expect(screen.getByText("Liquidity Removed")).toBeInTheDocument();
    expect(screen.getByText("1 unread")).toBeInTheDocument();
    // Rebalance history entry.
    expect(screen.getByText("1 change")).toBeInTheDocument();
  });
});
