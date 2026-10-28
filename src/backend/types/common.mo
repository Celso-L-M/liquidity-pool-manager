module {
  public type UserId = Principal;
  // Nanoseconds since the Unix epoch (matches mo:core/Time.now()).
  public type Timestamp = Int;
  // Stable identifier for a DEX pool (GeckoTerminal pool address).
  public type PoolId = Text;
};
