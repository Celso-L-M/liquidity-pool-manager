import Types "../types/common";

module {
  // A DEX pool with live metrics pulled from the GeckoTerminal API.
  public type Pool = {
    id : Types.PoolId;
    name : Text;
    dex : Text;
    apy : Float;
    volume24h : Float;
    fees24h : Float;
    tvl : Float;
    priceVolatility : Float;
    compositeScore : Float;
  };

  // A pool the user has added to their tracked portfolio.
  public type TrackedPool = {
    poolId : Types.PoolId;
    addedAt : Types.Timestamp;
  };
};
