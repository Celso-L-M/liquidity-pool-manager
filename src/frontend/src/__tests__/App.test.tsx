import "@testing-library/jest-dom/vitest";
import App from "@/App";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockActor,
  renderWithProviders,
  setActor,
  setAuthenticated,
} from "./test-utils";

vi.mock("@caffeineai/core-infrastructure", () => import("./test-utils"));

describe("login gating", () => {
  beforeEach(() => {
    setAuthenticated(false);
    setActor(null);
  });

  it("shows the login landing page and no dashboard data when unauthenticated", async () => {
    renderWithProviders(<App />);

    // The router renders the matched route asynchronously, so await the login
    // button before asserting on the landing page.
    expect(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    ).toBeInTheDocument();
    // No authenticated dashboard content is reachable.
    expect(
      screen.queryByRole("heading", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Pool Optimizer")).not.toBeInTheDocument();
    expect(screen.queryByText("Allocations")).not.toBeInTheDocument();
  });

  it("renders the private dashboard once authenticated", async () => {
    setAuthenticated(true);
    setActor(createMockActor());

    renderWithProviders(<App />);

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    // The login button is gone once signed in.
    expect(
      screen.queryByRole("button", { name: /sign in with internet identity/i }),
    ).not.toBeInTheDocument();
  });
});
