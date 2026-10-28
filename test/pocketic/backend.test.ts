import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

// Two distinct, non-anonymous principals used to exercise per-caller isolation.
// Derived from deterministic identities via @dfinity/pic (which is resolvable
// from this lane) rather than importing @icp-sdk/core/principal directly, which
// is not reachable from app/test/ in this project's module layout.
const alice = createIdentity("alice-seed").getPrincipal();
const bob = createIdentity("bob-seed").getPrincipal();

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  // Register alice as the first caller (admin) so #user-gated methods pass.
  actor.setPrincipal(alice);
  await actor._initialize_access_control();

  await expect(actor.listPools()).resolves.toEqual([]);
  await expect(actor.listTrackedPools()).resolves.toEqual([]);
  await expect(actor.listAllocations()).resolves.toEqual([]);
  await expect(actor.listNotifications()).resolves.toEqual([]);
  await expect(actor.listRebalanceHistory()).resolves.toEqual([]);
  await expect(actor.listCredentials()).resolves.toEqual([]);
  await expect(actor.getPool("missing-pool")).resolves.toEqual([]);
  await expect(actor.getCredential("missing-cred")).resolves.toEqual([]);
  await expect(actor.getApiDoc()).resolves.toBeTypeOf("string");
});

it("round-trips a tracked pool through the real canister", async () => {
  actor.setPrincipal(alice);
  await actor.addTrackedPool("pool-icp-usdc");
  const tracked = await actor.listTrackedPools();
  expect(tracked).toHaveLength(1);
  expect(tracked[0]).toMatchObject({ poolId: "pool-icp-usdc" });
});

it("round-trips target allocations and computes a rebalance", async () => {
  actor.setPrincipal(alice);
  await actor.setTarget([
    { poolId: "pool-icp-usdc", targetPercent: 60n },
    { poolId: "pool-icp-ckbtc", targetPercent: 40n },
  ]);

  const allocations = await actor.listAllocations();
  expect(allocations).toHaveLength(2);
  const icp = allocations.find((a) => a.poolId === "pool-icp-usdc");
  // With no rebalance history yet, the backend derives the current allocation
  // from the target, so current == target and deviation is 0.
  expect(icp).toMatchObject({ targetPercent: 60n, currentPercent: 60n, deviation: 0n });

  const changes = await actor.computeRebalance(
    [
      { poolId: "pool-icp-usdc", targetPercent: 50n },
      { poolId: "pool-icp-ckbtc", targetPercent: 50n },
    ],
    [
      { poolId: "pool-icp-usdc", targetPercent: 60n },
      { poolId: "pool-icp-ckbtc", targetPercent: 40n },
    ],
  );
  expect(changes).toHaveLength(2);
});

it("records a rebalance in history", async () => {
  actor.setPrincipal(alice);
  const record = await actor.rebalance();
  expect(record.changes.length).toBeGreaterThan(0);
  const history = await actor.listRebalanceHistory();
  expect(history).toHaveLength(1);
  expect(history[0].id).toBe(record.id);
});

it("round-trips alert preferences", async () => {
  actor.setPrincipal(alice);
  await actor.updatePreferences({
    liquidityRemoved: false,
    liquidityWithdrawn: true,
    impermanentLossRisk: true,
    emailDelivery: false,
  });
  const prefs = await actor.getPreferences();
  expect(prefs).toMatchObject({
    liquidityRemoved: false,
    liquidityWithdrawn: true,
    impermanentLossRisk: true,
    emailDelivery: false,
  });
});

it("creates a notification and marks it read", async () => {
  actor.setPrincipal(alice);
  // Ensure the alert type is enabled: an earlier test may have disabled
  // liquidityRemoved, and createNotification respects the caller's prefs.
  await actor.updatePreferences({
    liquidityRemoved: true,
    liquidityWithdrawn: true,
    impermanentLossRisk: true,
    emailDelivery: false,
  });
  await actor.createNotification({ liquidityRemoved: null }, "pool-icp-usdc", "alice@example.com");
  const notifications = await actor.listNotifications();
  expect(notifications).toHaveLength(1);
  expect(notifications[0]).toMatchObject({ read: false, poolId: "pool-icp-usdc" });

  await actor.markRead(notifications[0].id);
  const after = await actor.listNotifications();
  expect(after[0].read).toBe(true);
});

it("round-trips credentials and checks connection", async () => {
  actor.setPrincipal(alice);
  const cred = {
    id: "cred-1",
    exchange: "Uniswap",
    apiKey: "key-123",
    apiSecret: "secret-456",
    status: { disconnected: null },
    createdAt: 1_700_000_000_000_000_000n,
  };
  await actor.addCredential(cred);

  const listed = await actor.listCredentials();
  expect(listed).toHaveLength(1);
  // The view never exposes the secret.
  expect(listed[0]).toMatchObject({ id: "cred-1", exchange: "Uniswap", apiKey: "key-123" });
  expect(listed[0]).not.toHaveProperty("apiSecret");

  const single = await actor.getCredential("cred-1");
  expect(single).toEqual([listed[0]]);

  const status = await actor.checkConnection("cred-1");
  expect(status).toEqual({ connected: null });

  await actor.updateCredential({ ...cred, apiKey: "key-999" });
  const updated = await actor.getCredential("cred-1");
  expect(updated).toEqual([expect.objectContaining({ apiKey: "key-999" })]);

  await actor.removeCredential("cred-1");
  await expect(actor.listCredentials()).resolves.toEqual([]);
});

it("does not leak one caller's data to another", async () => {
  // Register bob as a second, non-admin caller.
  actor.setPrincipal(bob);
  await actor._initialize_access_control();

  // Alice adds a tracked pool and a credential.
  actor.setPrincipal(alice);
  await actor.addTrackedPool("pool-alice-only");
  await actor.addCredential({
    id: "cred-alice",
    exchange: "Binance",
    apiKey: "alice-key",
    apiSecret: "alice-secret",
    status: { disconnected: null },
    createdAt: 1_700_000_000_000_000_000n,
  });

  // Bob sees none of Alice's data.
  actor.setPrincipal(bob);
  const bobTracked = await actor.listTrackedPools();
  expect(bobTracked.map((t) => t.poolId)).not.toContain("pool-alice-only");
  const bobCreds = await actor.listCredentials();
  expect(bobCreds.map((c) => c.id)).not.toContain("cred-alice");
  await expect(actor.getCredential("cred-alice")).resolves.toEqual([]);

  // Alice still sees her own data.
  actor.setPrincipal(alice);
  const aliceTracked = await actor.listTrackedPools();
  expect(aliceTracked.map((t) => t.poolId)).toContain("pool-alice-only");
  const aliceCreds = await actor.listCredentials();
  expect(aliceCreds.map((c) => c.id)).toContain("cred-alice");
});
