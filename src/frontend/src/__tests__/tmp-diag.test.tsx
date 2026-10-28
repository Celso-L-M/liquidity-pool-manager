import "@testing-library/jest-dom/vitest";
import Allocations from "@/pages/Allocations";
import type { AllocationView, Pool, RebalanceRecord } from "@/types";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockActor,
  renderWithProviders,
  setActor,
  setAuthenticated,
} from "./test-utils";

vi.mock("@caffeineai/core-infrastructure", () => import("./test-utils"));

const allocations: AllocationView[] = [
  {
    poolId: "icp-usdc",
    currentPercent: 40n,
    targetPercent: 60n,
    deviation: 20n,
  },
];

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

const history: RebalanceRecord[] = [
  {
    id: 1n,
    at: 1_700_000_000_000_000_000n,
    changes: [{ poolId: "icp-usdc", fromPercent: 40n, toPercent: 60n }],
  },
];

describe("Allocations rebalance history", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(
      createMockActor({
        listAllocations: vi.fn(async () => allocations),
        listTrackedPools: vi.fn(async () => [
          { poolId: "icp-usdc", addedAt: 0n },
        ]),
        listPools: vi.fn(async () => pools),
        listRebalanceHistory: vi.fn(async () => history),
      }),
    );
  });

  it("renders recorded rebalancing actions with pool and allocation change", async () => {
    renderWithProviders(<Allocations />);

    expect(await screen.findByText("Rebalancing history")).toBeInTheDocument();
    // The pool appears in both the allocation table and the history change row.
    await waitFor(() =>
      expect(screen.getAllByText("ICP/USDC").length).toBeGreaterThanOrEqual(2),
    );
    // The change row shows the from -> to allocation change.
    expect(screen.getAllByText("40.0%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("60.0%").length).toBeGreaterThanOrEqual(2);
  });
});
