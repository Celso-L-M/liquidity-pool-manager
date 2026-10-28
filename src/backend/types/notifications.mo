import Types "../types/common";

module {
  // The kinds of liquidity-extraction / risk events the app can detect.
  public type NotificationType = {
    #liquidityRemoved;
    #liquidityWithdrawn;
    #impermanentLossRisk;
  };

  // A single notification delivered to a user's in-app notification center.
  public type Notification = {
    id : Nat;
    kind : NotificationType;
    poolId : Types.PoolId;
    at : Types.Timestamp;
    read : Bool;
  };

  // Per-user alert configuration.
  public type AlertPreferences = {
    liquidityRemoved : Bool;
    liquidityWithdrawn : Bool;
    impermanentLossRisk : Bool;
    emailDelivery : Bool;
  };
};
