import "@testing-library/jest-dom/vitest";
import Optimizer from "@/pages/Optimizer";
import type { Pool } from "@/types";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Optimizer", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(
      createMockActor({
        listPools: vi.fn(async () => pools),
        listTrackedPools: vi.fn(async () => []),
        addTrackedPool: vi.fn(async () => undefined),
      }),
    );
  });

  it("renders the pool leaderboard ranked by composite score", async () => {
    renderWithProviders(<Optimizer />);

    expect(await screen.findByText("ICP/USDC")).toBeInTheDocument();
    expect(screen.getByText("ICP/ckBTC")).toBeInTheDocument();

    // Ranked by composite score descending: ICP/USDC (0.85) before ICP/ckBTC (0.6).
    const rows = screen.getAllByRole("row");
    const firstDataRow = rows.find((row) =>
      within(row).queryByText("ICP/USDC"),
    );
    const secondDataRow = rows.find((row) =>
      within(row).queryByText("ICP/ckBTC"),
    );
    expect(firstDataRow).toBeTruthy();
    expect(secondDataRow).toBeTruthy();
    expect(rows.indexOf(firstDataRow as HTMLElement)).toBeLessThan(
      rows.indexOf(secondDataRow as HTMLElement),
    );
  });

  it("renders ICP pools in the leaderboard ranked by composite score", async () => {
    // ICP network pools (the data path this app will move to). The leaderboard
    // rendering must rank whatever pools the actor returns, independent of the
    // chain they come from.
    const icpPools: Pool[] = [
      {
        id: "icp-usdc",
        name: "ICP/USDC",
        dex: "ICPSwap",
        apy: 9.0,
        volume24h: 3_000_000,
        fees24h: 9_000,
        tvl: 30_000_000,
        priceVolatility: 0.15,
        compositeScore: 0.72,
      },
      {
        id: "icp-ckbtc",
        name: "ICP/ckBTC",
        dex: "ICPSwap",
        apy: 14.0,
        volume24h: 6_000_000,
        fees24h: 18_000,
        tvl: 60_000_000,
        priceVolatility: 0.25,
        compositeScore: 0.9,
      },
    ];
    setActor(
      createMockActor({
        listPools: vi.fn(async () => icpPools),
        listTrackedPools: vi.fn(async () => []),
        addTrackedPool: vi.fn(async () => undefined),
      }),
    );

    renderWithProviders(<Optimizer />);

    expect(await screen.findByText("ICP/ckBTC")).toBeInTheDocument();
    expect(screen.getByText("ICP/USDC")).toBeInTheDocument();

    // Ranked by composite score descending: ICP/ckBTC (0.9) before ICP/USDC (0.72).
    const rows = screen.getAllByRole("row");
    const first = rows.find((row) => within(row).queryByText("ICP/ckBTC"));
    const second = rows.find((row) => within(row).queryByText("ICP/USDC"));
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(rows.indexOf(first as HTMLElement)).toBeLessThan(
      rows.indexOf(second as HTMLElement),
    );
  });

  it("adds a pool to the tracked portfolio", async () => {
    const addTrackedPool = vi.fn(async () => undefined);
    setActor(
      createMockActor({
        listPools: vi.fn(async () => pools),
        listTrackedPools: vi.fn(async () => []),
        addTrackedPool,
      }),
    );

    renderWithProviders(<Optimizer />);
    await screen.findByText("ICP/USDC");

    await userEvent.click(
      screen.getByRole("button", { name: /track icp\/usdc/i }),
    );

    await waitFor(() =>
      expect(addTrackedPool).toHaveBeenCalledWith("icp-usdc"),
    );
  });
});
