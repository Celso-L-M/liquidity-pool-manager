import Types "../types/common";
import NotificationTypes "../types/notifications";

module {
  // Detects a liquidity-extraction event for a pool, if one is present.
  //
  // Detection requires live pool data (liquidity levels and price volatility),
  // which this build does not pass into the detector. It therefore reports no
  // event; callers that hold pool data should evaluate the event themselves
  // and deliver it via createNotification.
  public func detectLiquidityExtraction(poolId : Types.PoolId) : ?NotificationTypes.NotificationType {
    ignore poolId;
    null
  };
};
