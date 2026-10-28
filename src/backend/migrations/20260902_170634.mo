import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type PoolId = Text;
  type UserId = Principal;
  type Timestamp = Int;

  type Pool = {
    id : PoolId;
    name : Text;
    dex : Text;
    apy : Float;
    volume24h : Float;
    fees24h : Float;
    tvl : Float;
    priceVolatility : Float;
    compositeScore : Float;
  };

  type TrackedPool = {
    poolId : PoolId;
    addedAt : Timestamp;
  };

  type Allocation = {
    poolId : PoolId;
    targetPercent : Nat;
  };

  type AllocationChange = {
    poolId : PoolId;
    fromPercent : Nat;
    toPercent : Nat;
  };

  type RebalanceRecord = {
    id : Nat;
    at : Timestamp;
    changes : [AllocationChange];
  };

  type NotificationType = {
    #liquidityRemoved;
    #liquidityWithdrawn;
    #impermanentLossRisk;
  };

  type Notification = {
    id : Nat;
    kind : NotificationType;
    poolId : PoolId;
    at : Timestamp;
    read : Bool;
  };

  type AlertPreferences = {
    liquidityRemoved : Bool;
    liquidityWithdrawn : Bool;
    impermanentLossRisk : Bool;
    emailDelivery : Bool;
  };

  type CredentialStatus = {
    #connected;
    #disconnected;
    #error : Text;
  };

  type Credential = {
    id : Text;
    exchange : Text;
    apiKey : Text;
    apiSecret : Text;
    status : CredentialStatus;
    createdAt : Int;
  };

  type OldActor = {};

  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    pools : Map.Map<PoolId, Pool>;
    trackedPools : Map.Map<UserId, List.List<TrackedPool>>;
    allocations : Map.Map<UserId, List.List<Allocation>>;
    rebalanceHistory : Map.Map<UserId, List.List<RebalanceRecord>>;
    notifications : Map.Map<UserId, List.List<Notification>>;
    alertPrefs : Map.Map<UserId, AlertPreferences>;
    credentials : Map.Map<UserId, Map.Map<Text, Credential>>;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      pools = Map.empty();
      trackedPools = Map.empty();
      allocations = Map.empty();
      rebalanceHistory = Map.empty();
      notifications = Map.empty();
      alertPrefs = Map.empty();
      credentials = Map.empty();
    };
  };
};
