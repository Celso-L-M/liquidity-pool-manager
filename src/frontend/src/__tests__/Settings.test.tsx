import "@testing-library/jest-dom/vitest";
import type { CredentialView } from "@/backend";
import Settings from "@/pages/Settings";
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

const credentials: CredentialView[] = [
  {
    id: "c1",
    exchange: "Uniswap",
    apiKey: "key-1",
    status: { __kind__: "connected", connected: null },
    createdAt: 1_700_000_000_000_000_000n,
  },
];

describe("Settings", () => {
  beforeEach(() => {
    setAuthenticated(true);
    setActor(
      createMockActor({
        listCredentials: vi.fn(async () => credentials),
        addCredential: vi.fn(async () => undefined),
        updateCredential: vi.fn(async () => undefined),
        removeCredential: vi.fn(async () => undefined),
      }),
    );
  });

  it("lists stored credentials with connection status", async () => {
    renderWithProviders(<Settings />);

    expect(await screen.findByText("Uniswap")).toBeInTheDocument();
    expect(screen.getByText("key-1")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("adds a credential", async () => {
    const addCredential = vi.fn(async () => undefined);
    setActor(
      createMockActor({
        listCredentials: vi.fn(async () => []),
        addCredential,
        updateCredential: vi.fn(async () => undefined),
        removeCredential: vi.fn(async () => undefined),
      }),
    );

    renderWithProviders(<Settings />);
    await screen.findByLabelText("Exchange");

    await userEvent.type(screen.getByLabelText("Exchange"), "Binance");
    await userEvent.type(screen.getByLabelText("API key"), "key-2");
    await userEvent.type(screen.getByLabelText("API secret"), "secret-2");

    await userEvent.click(
      screen.getByRole("button", { name: /add credential/i }),
    );

    await waitFor(() => expect(addCredential).toHaveBeenCalled());
  });
});
