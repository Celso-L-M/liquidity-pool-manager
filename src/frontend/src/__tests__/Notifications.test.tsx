import "@testing-library/jest-dom/vitest";
import { NotificationType } from "@/backend";
import Notifications from "@/pages/Notifications";
import type { Notification } from "@/types";
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

const notifications: Notification[] = [
  {
    id: 1n,
    kind: NotificationType.liquidityRemoved,
    poolId: "p1",
    at: 1_700_000_000_000_000_000n,
    read: false,
  },
  {
    id: 2n,
    kind: NotificationType.impermanentLossRisk,
    poolId: "p2",
    at: 1_700_000_000_000_000_000n,
    read: true,
  },
];

const defaultPrefs = {
  liquidityRemoved: true,
  liquidityWithdrawn: true,
  impermanentLossRisk: true,
  emailDelivery: false,
};

describe("Notifications", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(
      createMockActor({
        listNotifications: vi.fn(async () => notifications),
        listPools: vi.fn(async () => []),
        getPreferences: vi.fn(async () => defaultPrefs),
        markRead: vi.fn(async () => undefined),
        updatePreferences: vi.fn(async () => undefined),
      }),
    );
  });

  it("shows notification history with read/unread state", async () => {
    renderWithProviders(<Notifications />);

    expect(await screen.findByText("Liquidity Removed")).toBeInTheDocument();
    expect(screen.getByText("Impermanent-Loss Risk")).toBeInTheDocument();
    // One unread notification (id 1).
    expect(screen.getByText("1 unread alert")).toBeInTheDocument();
  });

  it("marks a notification read", async () => {
    const markRead = vi.fn(async () => undefined);
    setActor(
      createMockActor({
        listNotifications: vi.fn(async () => notifications),
        listPools: vi.fn(async () => []),
        getPreferences: vi.fn(async () => defaultPrefs),
        markRead,
        updatePreferences: vi.fn(async () => undefined),
      }),
    );

    renderWithProviders(<Notifications />);
    await screen.findByText("Liquidity Removed");

    await userEvent.click(
      screen.getByRole("button", { name: /mark as read/i }),
    );

    await waitFor(() => expect(markRead).toHaveBeenCalledWith(1n));
  });
});
