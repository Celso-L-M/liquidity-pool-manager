import AllocationTypes "../types/allocations";

module {
  // Validates that target allocations sum to 100%.
  public func validateAllocations(targets : [AllocationTypes.Allocation]) : Bool {
    var sum = 0;
    for (t in targets.values()) {
      sum += t.targetPercent;
    };
    sum == 100;
  };

  // Computes the trades needed to move current allocations toward targets.
  public func computeRebalance(
    current : [AllocationTypes.Allocation],
    targets : [AllocationTypes.Allocation],
  ) : [AllocationTypes.AllocationChange] {
    // Move each target pool from its current allocation toward its target.
    let targetChanges = targets.map(
      func target {
        let cur = current.find(func c = c.poolId == target.poolId);
        let fromPercent = switch (cur) { case (?c) c.targetPercent; case null 0; };
        { poolId = target.poolId; fromPercent = fromPercent; toPercent = target.targetPercent; };
      }
    );
    // Reduce pools that are currently held but no longer targeted to 0.
    let currentOnly = current.filter(func c = not targets.any(func t = t.poolId == c.poolId));
    let currentOnlyChanges = currentOnly.map(
      func c = { poolId = c.poolId; fromPercent = c.targetPercent; toPercent = 0; }
    );
    targetChanges.concat(currentOnlyChanges);
  };
};
