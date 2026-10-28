import Types "../types/common";

module {
  // A target percentage allocation for a tracked pool (0-100).
  public type Allocation = {
    poolId : Types.PoolId;
    targetPercent : Nat;
  };

  // A single pool's allocation change produced by a rebalancing action.
  public type AllocationChange = {
    poolId : Types.PoolId;
    fromPercent : Nat;
    toPercent : Nat;
  };

  // A recorded rebalancing action with its resulting allocation changes.
  public type RebalanceRecord = {
    id : Nat;
    at : Types.Timestamp;
    changes : [AllocationChange];
  };

  // A pool's current vs target allocation with the signed deviation.
  public type AllocationView = {
    poolId : Types.PoolId;
    currentPercent : Nat;
    targetPercent : Nat;
    deviation : Int;
  };
};
