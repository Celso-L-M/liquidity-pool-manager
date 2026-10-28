import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import NatValue "mo:caffeineai-oql/NatValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Types "types/common";
import PoolTypes "types/pools";
import AllocationTypes "types/allocations";
import NotificationTypes "types/notifications";
import SettingsTypes "types/settings";
import PoolsApi "mixins/pools-api";
import AllocationsApi "mixins/allocations-api";
import NotificationsApi "mixins/notifications-api";
import CredentialsApi "mixins/credentials-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Pool Optimizer state.
  let pools : Map.Map<Types.PoolId, PoolTypes.Pool>;
  let trackedPools : Map.Map<Types.UserId, List.List<PoolTypes.TrackedPool>>;

  // Allocations & Rebalancing state.
  let allocations : Map.Map<Types.UserId, List.List<AllocationTypes.Allocation>>;
  let rebalanceHistory : Map.Map<Types.UserId, List.List<AllocationTypes.RebalanceRecord>>;

  // Notifications & Alerts state.
  let notifications : Map.Map<Types.UserId, List.List<NotificationTypes.Notification>>;
  let alertPrefs : Map.Map<Types.UserId, NotificationTypes.AlertPreferences>;

  // Settings & Credentials state.
  let credentials : Map.Map<Principal, Map.Map<Text, SettingsTypes.Credential>>;

  include PoolsApi(pools, trackedPools);
  include AllocationsApi(accessControlState, allocations, rebalanceHistory);
  include NotificationsApi(notifications, alertPrefs);
  include CredentialsApi(accessControlState, credentials);

  // ---- OQL row sources -----------------------------------------------------
  // Owner-keyed per-user storage (Map<UserId, List<T>>) is exposed through
  // subject-scoped iterators so a scoped read scans only the caller's rows.

  func trackedIter(p : ?Principal) : Iter.Iter<PoolTypes.TrackedPool> {
    switch (p) {
      case (?u) {
        switch (trackedPools.get(u)) {
          case (?l) l.values();
          case null [].values();
        };
      };
      case null {
        trackedPools.entries().flatMap(func ((_, l)) = l.values());
      };
    };
  };

  func allocIter(p : ?Principal) : Iter.Iter<AllocationTypes.Allocation> {
    switch (p) {
      case (?u) {
        switch (allocations.get(u)) {
          case (?l) l.values();
          case null [].values();
        };
      };
      case null {
        allocations.entries().flatMap(func ((_, l)) = l.values());
      };
    };
  };

  func alertIter(p : ?Principal) : Iter.Iter<NotificationTypes.AlertPreferences> {
    switch (p) {
      case (?u) {
        switch (alertPrefs.get(u)) {
          case (?a) [a].values();
          case null [].values();
        };
      };
      case null {
        alertPrefs.entries().map(func ((_, a)) = a);
      };
    };
  };

  func rebalanceIter() : Iter.Iter<(Principal, AllocationTypes.RebalanceRecord)> {
    rebalanceHistory.entries().flatMap(func ((u, l)) = l.values().map(func r = (u, r)));
  };

  func notificationIter() : Iter.Iter<(Principal, NotificationTypes.Notification)> {
    notifications.entries().flatMap(func ((u, l)) = l.values().map(func n = (u, n)));
  };

  func credentialIter() : Iter.Iter<(Principal, SettingsTypes.Credential)> {
    credentials.entries().flatMap(func ((u, l)) = l.values().map(func c = (u, c)));
  };

  transient let anyP = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      // Public pool leaderboard — world-readable.
      pools.toEntity("pool", "Pool", "id")
        .sample({ id = ""; name = ""; dex = ""; apy = 0.0; volume24h = 0.0; fees24h = 0.0; tvl = 0.0; priceVolatility = 0.0; compositeScore = 0.0 })
        .public_()
        .build(),
      // Per-user tracked portfolio (owner-keyed storage).
      OQL.Entity.newScoped<PoolTypes.TrackedPool>("trackedPool", trackedIter, "TrackedPool", "poolId")
        .sample({ poolId = ""; addedAt = 0 })
        .controllerOrScoped()
        .build(),
      // Per-user target allocations (owner-keyed storage).
      OQL.Entity.newScoped<AllocationTypes.Allocation>("allocation", allocIter, "Allocation", "poolId")
        .sample({ poolId = ""; targetPercent = 0 })
        .controllerOrScoped()
        .build(),
      // Per-user rebalancing history (collection field -> manual mode).
      OQL.Entity.manual<(Principal, AllocationTypes.RebalanceRecord)>("rebalanceRecord", rebalanceIter, "RebalanceRecord", "id")
        .sample((anyP, { id = 0; at = 0; changes = [] }))
        .payload("owner", func ((u, _)) = u)
        .payload("id", func ((_, r)) = r.id)
        .payload("at", func ((_, r)) = r.at)
        .payload("changeCount", func ((_, r)) = r.changes.size())
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // Per-user notifications (variant field -> manual mode).
      OQL.Entity.manual<(Principal, NotificationTypes.Notification)>("notification", notificationIter, "Notification", "id")
        .sample((anyP, { id = 0; kind = #liquidityRemoved; poolId = ""; at = 0; read = false }))
        .payload("owner", func ((u, _)) = u)
        .payload("id", func ((_, n)) = n.id)
        .payload("kind", func ((_, n)) = switch (n.kind) { case (#liquidityRemoved) { "liquidityRemoved" }; case (#liquidityWithdrawn) { "liquidityWithdrawn" }; case (#impermanentLossRisk) { "impermanentLossRisk" } })
        .payload("poolId", func ((_, n)) = n.poolId)
        .payload("at", func ((_, n)) = n.at)
        .payload("read", func ((_, n)) = n.read)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // Per-user alert preferences (owner-keyed storage).
      OQL.Entity.newScoped<NotificationTypes.AlertPreferences>("alertPreference", alertIter, "AlertPreferences", "liquidityRemoved")
        .sample({ liquidityRemoved = false; liquidityWithdrawn = false; impermanentLossRisk = false; emailDelivery = false })
        .controllerOrScoped()
        .build(),
      // Per-user credentials (variant field -> manual mode; secrets omitted).
      OQL.Entity.manual<(Principal, SettingsTypes.Credential)>("credential", credentialIter, "Credential", "id")
        .sample((anyP, { id = ""; exchange = ""; apiKey = ""; apiSecret = ""; status = #disconnected; createdAt = 0 }))
        .payload("owner", func ((u, _)) = u)
        .payload("id", func ((_, c)) = c.id)
        .payload("exchange", func ((_, c)) = c.exchange)
        .payload("connectionStatus", func ((_, c)) = switch (c.status) { case (#connected) { "connected" }; case (#disconnected) { "disconnected" }; case (#error(_)) { "error" } })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });

  include ApiDocMixin();
};
