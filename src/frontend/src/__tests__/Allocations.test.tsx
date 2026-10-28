import "@testing-library/jest-dom/vitest";
import Allocations from "@/pages/Allocations";
import type { AllocationView, Pool } from "@/types";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  {
    poolId: "icp-ckbtc",
    currentPercent: 60n,
    targetPercent: 40n,
    deviation: -20n,
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
  {
    id: "icp-ckbtc",
    name: "ICP/ckBTC",
    dex: "ICPSwap",
    apy: 8.0,
    volume24h: 2_000_000,
    fees24h: 6_000,
    tvl: 20_000_000,
    priceVolatility: 0.3,
    compositeScore: 0.6,
  },
];

function baseActor(overrides: Record<string, unknown> = {}) {
  return createMockActor({
    listAllocations: vi.fn(async () => allocations),
    listTrackedPools: vi.fn(async () => [
      { poolId: "icp-usdc", addedAt: 0n },
      { poolId: "icp-ckbtc", addedAt: 0n },
    ]),
    listPools: vi.fn(async () => pools),
    listRebalanceHistory: vi.fn(async () => []),
    setTarget: vi.fn(async () => undefined),
    rebalance: vi.fn(async () => ({ id: 0n, at: 0n, changes: [] })),
    ...overrides,
  });
}

describe("Allocations", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(baseActor());
  });

  it("shows current vs target allocation with a valid target sum", async () => {
    renderWithProviders(<Allocations />);

    expect(await screen.findByText("Target allocation")).toBeInTheDocument();
    // Targets 60 + 40 = 100, so the save button becomes enabled.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /save targets/i }),
      ).toBeEnabled(),
    );
  });

  it("saves target allocations", async () => {
    const setTarget = vi.fn(async () => undefined);
    setActor(baseActor({ setTarget }));

    renderWithProviders(<Allocations />);
    await screen.findByText("Target allocation");

    const saveButton = screen.getByRole("button", { name: /save targets/i });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    await waitFor(() => expect(setTarget).toHaveBeenCalled());
  });

  it("triggers a rebalancing action", async () => {
    const rebalance = vi.fn(async () => ({ id: 1n, at: 0n, changes: [] }));
    setActor(baseActor({ rebalance }));

    renderWithProviders(<Allocations />);
    await screen.findByText("Target allocation");

    await userEvent.click(
      screen.getByRole("button", { name: /trigger rebalance/i }),
    );

    await waitFor(() => expect(rebalance).toHaveBeenCalled());
  });

  it("renders target-allocation rows from tracked pools mapped through the pool list", async () => {
    renderWithProviders(<Allocations />);

    // Rows come from tracked pools resolved against the pool list, so the
    // pool names appear and each row exposes a target-percentage input.
    expect(await screen.findByText("ICP/USDC")).toBeInTheDocument();
    expect(screen.getByText("ICP/ckBTC")).toBeInTheDocument();

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(2);
    expect(screen.getByRole("button", { name: /save targets/i })).toBeEnabled();
  });

  it("shows the empty state when no tracked pool resolves to a known pool", async () => {
    setActor(baseActor({ listPools: vi.fn(async () => []) }));

    renderWithProviders(<Allocations />);
    await screen.findByText("Target allocation");

    await waitFor(() =>
      expect(screen.queryByText(/No tracked pools yet/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("ICP/USDC")).not.toBeInTheDocument();
  });
});
