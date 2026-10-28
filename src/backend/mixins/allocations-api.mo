import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/common";
import AllocationTypes "../types/allocations";
import AllocationsLib "../lib/allocations";

mixin (
  accessControlState : AccessControl.AccessControlState,
  allocations : Map.Map<Types.UserId, List.List<AllocationTypes.Allocation>>,
  rebalanceHistory : Map.Map<Types.UserId, List.List<AllocationTypes.RebalanceRecord>>,
) {
  // The caller's current allocations, derived from the last rebalance (or target if none).
  func getCurrentAllocations(userId : Types.UserId) : [AllocationTypes.Allocation] {
    let history = rebalanceHistory.get(userId);
    switch (history) {
      case (?h) {
        var last : ?AllocationTypes.RebalanceRecord = null;
        for (r in h.values()) {
          last := ?r;
        };
        switch (last) {
          case (?l) {
            l.changes.map(func c = { poolId = c.poolId; targetPercent = c.toPercent; });
          };
          case null {
            let targets = allocations.get(userId);
            switch (targets) { case (?t) t.toArray(); case null []; };
          };
        };
      };
      case null {
        let targets = allocations.get(userId);
        switch (targets) { case (?t) t.toArray(); case null []; };
      };
    };
  };

  // Sets the caller's target allocations (must sum to 100%).
  public shared ({ caller }) func setTarget(targets : [AllocationTypes.Allocation]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set allocations");
    };
    if (not AllocationsLib.validateAllocations(targets)) {
      Runtime.trap("Allocations must sum to 100%");
    };
    let userTargets = List.empty<AllocationTypes.Allocation>();
    for (t in targets.values()) {
      userTargets.add(t);
    };
    allocations.add(caller, userTargets);
  };

  // Returns the caller's current vs target allocations with deviation.
  public query ({ caller }) func listAllocations() : async [AllocationTypes.AllocationView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view allocations");
    };
    let current = getCurrentAllocations(caller);
    let targets = allocations.get(caller);
    let targetList = switch (targets) { case (?t) t.toArray(); case null []; };
    targetList.map(
      func target {
        let cur = current.find(func c = c.poolId == target.poolId);
        let currentPercent = switch (cur) { case (?c) c.targetPercent; case null 0; };
        let deviation = target.targetPercent.toInt() - currentPercent.toInt();
        {
          poolId = target.poolId;
          currentPercent = currentPercent;
          targetPercent = target.targetPercent;
          deviation = deviation;
        };
      }
    );
  };

  // Computes the trades needed to move current allocations toward targets.
  public query ({ caller }) func computeRebalance(
    current : [AllocationTypes.Allocation],
    targets : [AllocationTypes.Allocation],
  ) : async [AllocationTypes.AllocationChange] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can compute rebalance");
    };
    AllocationsLib.computeRebalance(current, targets);
  };

  // Triggers a rebalancing action and records it in history.
  public shared ({ caller }) func rebalance() : async AllocationTypes.RebalanceRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can rebalance");
    };
    let current = getCurrentAllocations(caller);
    let targets = allocations.get(caller);
    let targetList = switch (targets) { case (?t) t.toArray(); case null []; };
    let changes = AllocationsLib.computeRebalance(current, targetList);
    let history = rebalanceHistory.get(caller);
    let record = {
      id = switch (history) { case (?h) h.size(); case null 0; };
      at = Time.now();
      changes = changes;
    };
    let userHistory = switch (history) {
      case (?h) h;
      case null { List.empty<AllocationTypes.RebalanceRecord>() };
    };
    userHistory.add(record);
    rebalanceHistory.add(caller, userHistory);
    record;
  };

  // Returns the caller's rebalancing history.
  public query ({ caller }) func listRebalanceHistory() : async [AllocationTypes.RebalanceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view rebalance history");
    };
    let history = rebalanceHistory.get(caller);
    switch (history) { case (?h) h.toArray(); case null []; };
  };
};
