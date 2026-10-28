mixin () {
  public query func getApiDoc() : async Text {
    "# Pool Optimizer Backend API

## Purpose

The Pool Optimizer backend powers a DEX liquidity-pool optimizer. It pulls live
pool data from the GeckoTerminal ICP network endpoint
(`api.geckoterminal.com/api/v2/networks/icp/pools`), computes a composite
optimizer score per pool, ranks pools in a leaderboard, lets users track pools,
set target allocations, trigger rebalancing actions, receive liquidity-risk
notifications, and manage exchange/API credentials. All per-user data is
isolated by the caller's Internet Computer principal. The data source is
ICP-only; no other chain is supported.

## Public methods

### Access control (Internet Identity)

- `_initialize_access_control() : async ()` — registers the caller. The first
  caller to register becomes `#admin`; every subsequent caller becomes `#user`.
  Anonymous callers are ignored (no role is assigned).
- `_internet_identity_sign_in_start() : async Blob` — begins an Internet
  Identity sign-in, returning a challenge blob.
- `_internet_identity_sign_in_finish() : async Result<(), Error>` — completes
  the sign-in and registers the caller (same first-admin rule as
  `_initialize_access_control`).
- `getCallerUserRole() : async UserRole` — returns the caller's role
  (`#admin`, `#user`, or `#guest` for anonymous callers). Traps with
  \"User is not registered\" for a signed-in caller that has not registered.
- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` — assigns
  a role. Only `#admin` callers may call this; otherwise it traps with
  \"Unauthorized: Only admins can assign user roles\".
- `isCallerAdmin() : async Bool` — whether the caller is `#admin`.

### Pools (GeckoTerminal)

- `transform(input : TransformationInput) : async TransformationOutput` — the
  HTTP outcall response transform used by `refreshPools`.
- `refreshPools() : async ()` — fetches live pool data from GeckoTerminal and
  refreshes the stored pool set. No caller restriction.
- `listPools() : async [Pool]` — returns all pools ranked by composite score
  (leaderboard). No caller restriction.
- `getPool(poolId : Text) : async ?Pool` — returns one pool's detail, or `null`
  if unknown. No caller restriction.
- `addTrackedPool(poolId : Text) : async ()` — adds a pool to the caller's
  tracked portfolio (deduplicated). Caller-scoped.
- `listTrackedPools() : async [TrackedPool]` — returns the caller's tracked
  pools. Caller-scoped.

### Allocations & rebalancing

These methods require the caller to hold the `#user` role (admins pass the
check too). An unregistered or anonymous caller traps with
\"Unauthorized: Only users can ...\".

- `setTarget(targets : [Allocation]) : async ()` — sets the caller's target
  allocations. Traps with \"Allocations must sum to 100%\" if they do not.
- `listAllocations() : async [AllocationView]` — the caller's current vs target
  allocation with signed deviation.
- `computeRebalance(current : [Allocation], targets : [Allocation]) : async [AllocationChange]` —
  computes the trades needed to move current toward target. Pure; no state change.
- `rebalance() : async RebalanceRecord` — triggers a rebalancing action and
  records it in the caller's history.
- `listRebalanceHistory() : async [RebalanceRecord]` — the caller's rebalancing
  history.

### Notifications & alerts

These methods require a signed-in (non-anonymous) caller; an anonymous caller
traps with \"Unauthorized: Please sign in\".

- `listNotifications() : async [Notification]` — the caller's notification
  history (read/unread).
- `markRead(id : Nat) : async ()` — marks one notification read.
- `markAllRead() : async ()` — marks all of the caller's notifications read.
- `getPreferences() : async AlertPreferences` — the caller's alert preferences,
  or defaults if unset.
- `updatePreferences(prefs : AlertPreferences) : async ()` — updates the
  caller's alert-type and email-delivery preferences.
- `createNotification(kind : NotificationType, poolId : Text, email : Text) : async ()` —
  creates a notification for the caller and delivers it in-app; when email
  delivery is enabled it also sends a service email to the given address.

### Settings & credentials

- `addCredential(cred : Credential) : async ()` — stores a new exchange/API
  credential for the caller.
- `listCredentials() : async [Credential]` — the caller's stored credentials.
- `updateCredential(cred : Credential) : async ()` — updates a credential.
- `removeCredential(id : Nat) : async ()` — removes a credential.

### OQL data access

- `schema() : async Text` — the OQL schema describing the queryable entities.
- `execute(query : Text) : async Text` — runs an OQL JSON query over the exposed
  entities.

### Documentation

- `getApiDoc() : async Text` — this document.

## Authentication and authorization

- **Anonymous callers** are `#guest`. They may read public pool data
  (`listPools`, `getPool`, `refreshPools`, `transform`) and query the public
  `pool` OQL entity. They cannot access any per-user data.
- **Signed-in callers** must register first (via `_initialize_access_control` or
  an Internet Identity sign-in) before any role-guarded call, including guarded
  queries. The first initializer becomes `#admin`; all later callers become
  `#user`.
- **`#user` role** is required for allocations/rebalancing methods.
- **`#admin` role** is required for `assignCallerUserRole`.
- **Notifications** require only a signed-in (non-anonymous) caller.
- **OQL per-table authorization**: the `pool` entity is `#public_` (world
  readable). All per-user entities (`trackedPool`, `allocation`,
  `rebalanceRecord`, `notification`, `alertPreference`, `credential`) are
  `#controllerOrScoped`: a signed-in caller reads only their own rows, while the
  platform controller (the Data Intelligence agent) reads all rows. Credential
  secrets (`apiKey`, `apiSecret`) are never exposed through OQL.

## Identity derivation

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding the
user's Internet Identity authorization derives the correct per-app principal
against that origin, for example `icp identity link web <name> --app <host>`.
Such a delegation acts with the user's full authority in this app until it
expires.

A caller can be unregistered while the app already knows it: registration
happens only when a caller signs in through the app's own frontend, so a
principal that never did so is unregistered even when it belongs to the app's
owner. A signed-in caller derived against a different origin is a different
principal than the one the frontend registered.

## Units and encodings

- **Timestamps** (`addedAt`, `at`) are nanoseconds since the Unix epoch
  (`Int`), matching `mo:core/Time.now()`.
- **Pool identifiers** (`poolId`) are GeckoTerminal pool addresses (`Text`).
- **Percentages** (`targetPercent`, `currentPercent`, `fromPercent`,
  `toPercent`) are `Nat` in the range 0-100. `deviation` is a signed `Int`.
- **Notification kinds** are the variant `#liquidityRemoved`,
  `#liquidityWithdrawn`, `#impermanentLossRisk`. In OQL they are encoded as the
  text tags `liquidityRemoved`, `liquidityWithdrawn`, `impermanentLossRisk`.
- **Connection status** is the variant `#connected`, `#disconnected`, `#error`;
  in OQL it is encoded as the text tags `connected`, `disconnected`, `error`.
- **User roles** are the variant `#admin`, `#user`, `#guest`.
- **OQL rebalance records** expose `id`, `at`, and `changeCount` (the number of
  allocation changes); the nested `changes` array is not a queryable column.

## Lifecycle and polling

- `refreshPools()` is a one-shot update that fetches and stores pools. There is
  no automatic scheduled refresh; call it again to re-fetch. Polling
  `listPools()` after a `refreshPools()` call reflects the latest stored data.
- `rebalance()` records a new `RebalanceRecord` in the caller's history each
  time it is called; `listRebalanceHistory()` returns them in insertion order.

## Mutation retry safety

- `addTrackedPool` is idempotent: adding an already-tracked pool is a no-op.
- `setTarget` overwrites the caller's target allocations wholesale; re-calling
  with the same targets is idempotent.
- `rebalance()` is not idempotent — each call appends a new history record.
  Retrying a rebalance creates a duplicate record.
- `markRead` / `markAllRead` are idempotent.
- `updatePreferences` overwrites the caller's preferences wholesale.
- `createNotification` appends a new notification each call; retrying creates a
  duplicate notification and may send a duplicate email.

## Errors, traps, limits, and gotchas

- Role-guarded methods trap (reject) rather than return an error variant when
  the caller lacks the required role; the trap message is
  \"Unauthorized: ...\".
- `getCallerUserRole` traps with \"User is not registered\" for a signed-in but
  unregistered caller.
- `setTarget` traps with \"Allocations must sum to 100%\" on invalid input.
- `getPool` returns `null` for an unknown pool; it does not trap.
- OQL `execute` returns results as JSON text; the `pool` entity is world
  readable, while per-user entities return only the caller's own rows (or all
  rows for the controller).
- Credential secrets are never returned through OQL; use `listCredentials` for
  the full credential records.
- There is no automatic scheduled rebalancing, historical performance charts,
  or multi-network pool discovery in this backend."
  };
};
