import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/common";
import PoolTypes "../types/pools";
import PoolsLib "../lib/pools";

mixin (
  pools : Map.Map<Types.PoolId, PoolTypes.Pool>,
  trackedPools : Map.Map<Types.UserId, List.List<PoolTypes.TrackedPool>>,
) {
  // HTTP response transform required by the outcall (must be a query function on the actor).
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Fetches live pool data from GeckoTerminal and refreshes the stored pools.
  public shared func refreshPools() : async () {
    let fetched = await PoolsLib.fetchPools(transform);
    for (pool in fetched.values()) {
      pools.add(pool.id, pool);
    };
  };

  // Returns all pools ranked by composite score for the leaderboard.
  public query func listPools() : async [PoolTypes.Pool] {
    PoolsLib.rankPools(pools.values().toArray());
  };

  // Returns a single pool's detail.
  public query func getPool(poolId : Types.PoolId) : async ?PoolTypes.Pool {
    pools.get(poolId);
  };

  // Adds a pool to the caller's tracked portfolio (deduped).
  public shared ({ caller }) func addTrackedPool(poolId : Types.PoolId) : async () {
    let userList = trackedPools.get(caller) ?? List.empty<PoolTypes.TrackedPool>();
    let alreadyTracked = userList.toArray().any(func (tp) = tp.poolId == poolId);
    if (not alreadyTracked) {
      userList.add({ poolId; addedAt = Time.now() });
      trackedPools.add(caller, userList);
    };
  };

  // Returns the caller's tracked pools (per-user isolation via caller keying).
  public query ({ caller }) func listTrackedPools() : async [PoolTypes.TrackedPool] {
    (trackedPools.get(caller) ?? List.empty<PoolTypes.TrackedPool>()).toArray();
  };
};
