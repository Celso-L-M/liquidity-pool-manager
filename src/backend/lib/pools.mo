import Float "mo:core/Float";
import Json "mo:json/lib";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import PoolTypes "../types/pools";

module {
  // GeckoTerminal API endpoint for top ICP pools by 24h volume (anonymous tier).
  // The page parameter is bound server-side so the response stays within the
  // canister's response ceiling.
  let GECKO_URL = "https://api.geckoterminal.com/api/v2/networks/icp/pools?sort=h24_volume_usd_desc&page=1";

  // Normalizes a raw metric to a 0..1 scale against a reference ceiling.
  func normalize(value : Float, ceiling : Float) : Float {
    let ratio = value / ceiling;
    if (ratio > 1.0) { 1.0 } else if (ratio < 0.0) { 0.0 } else { ratio };
  };

  // Parses a decimal string (e.g. "100505665.001107", "-1.326") into a Float.
  // GeckoTerminal returns all numeric metrics as JSON strings, so they cannot
  // be read with getAsFloat (which only accepts JSON numbers).
  func parseFloat(text : Text) : Float {
    var isNegative = false;
    var whole = 0.0;
    var fracDigits = 0;
    var inFraction = false;
    for (c in text.chars()) {
      switch (c) {
        case ('-') { isNegative := true };
        case ('.') { inFraction := true };
        case ('0') { whole := whole * 10.0; if (inFraction) { fracDigits += 1 } };
        case ('1') { whole := whole * 10.0 + 1.0; if (inFraction) { fracDigits += 1 } };
        case ('2') { whole := whole * 10.0 + 2.0; if (inFraction) { fracDigits += 1 } };
        case ('3') { whole := whole * 10.0 + 3.0; if (inFraction) { fracDigits += 1 } };
        case ('4') { whole := whole * 10.0 + 4.0; if (inFraction) { fracDigits += 1 } };
        case ('5') { whole := whole * 10.0 + 5.0; if (inFraction) { fracDigits += 1 } };
        case ('6') { whole := whole * 10.0 + 6.0; if (inFraction) { fracDigits += 1 } };
        case ('7') { whole := whole * 10.0 + 7.0; if (inFraction) { fracDigits += 1 } };
        case ('8') { whole := whole * 10.0 + 8.0; if (inFraction) { fracDigits += 1 } };
        case ('9') { whole := whole * 10.0 + 9.0; if (inFraction) { fracDigits += 1 } };
        case (_) {};
      };
    };
    var divisor = 1.0;
    var i = 0;
    while (i < fracDigits) { divisor *= 10.0; i += 1 };
    let value = whole / divisor;
    if (isNegative) { -value } else { value };
  };

  // Reads a GeckoTerminal metric at the given path. The API returns every
  // numeric metric as a JSON string, so read it as text and parse to Float.
  func getFloat(item : Json.Json, path : Text) : Float {
    switch (Json.getAsText(item, path)) {
      case (#ok(v)) { parseFloat(v) };
      case (#err(_)) { 0.0 };
    };
  };

  // Computes the composite optimizer score from APY, volume, fees, TVL,
  // and impermanent-loss risk (estimated from price volatility).
  public func computeCompositeScore(pool : PoolTypes.Pool) : Float {
    let apyNorm = normalize(pool.apy, 100.0);
    let volumeNorm = normalize(pool.volume24h, 10_000_000.0);
    let feesNorm = normalize(pool.fees24h, 30_000.0);
    let tvlNorm = normalize(pool.tvl, 100_000_000.0);
    let ilRisk = normalize(pool.priceVolatility, 100.0);
    0.4 * apyNorm + 0.2 * volumeNorm + 0.15 * feesNorm + 0.15 * tvlNorm - 0.1 * ilRisk;
  };

  // Ranks pools by composite score for the leaderboard (descending).
  public func rankPools(pools : [PoolTypes.Pool]) : [PoolTypes.Pool] {
    pools.sort(func (a, b) = Float.compare(b.compositeScore, a.compositeScore));
  };

  // Fetches live DEX pool data from the GeckoTerminal API and derives the
  // optimizer metrics (fees, APY, volatility, composite score) per pool.
  public func fetchPools(transform : OutCall.Transform) : async [PoolTypes.Pool] {
    let body = await OutCall.httpGetRequest(GECKO_URL, [], transform);
    let parsed = switch (Json.parse(body)) {
      case (#ok(json)) { json };
      case (#err(e)) { Runtime.trap("Failed to parse GeckoTerminal response: " # Json.errToText(e)) };
    };
    let items = switch (Json.getAsArray(parsed, "data")) {
      case (#ok(arr)) { arr };
      case (#err(_)) { Runtime.trap("GeckoTerminal response missing data array") };
    };
    items.map(func (item) {
      let id = switch (Json.getAsText(item, "id")) {
        case (#ok(v)) { v };
        case (#err(_)) { Runtime.trap("Pool missing id") };
      };
      let name = switch (Json.getAsText(item, "attributes.name")) {
        case (#ok(v)) { v };
        case (#err(_)) { Runtime.trap("Pool missing name") };
      };
      let tvl = getFloat(item, "attributes.reserve_in_usd");
      let volume24h = getFloat(item, "attributes.volume_usd.h24");
      let priceChange = getFloat(item, "attributes.price_change_percentage.h24");
      let dex = switch (Json.getAsText(item, "relationships.dex.data.id")) {
        case (#ok(v)) { v };
        case (#err(_)) { "unknown" };
      };
      let fees24h = volume24h * 0.003;
      let apy = if (tvl > 0.0) { (fees24h * 365.0) / tvl } else { 0.0 };
      let priceVolatility = Float.abs(priceChange);
      let pool : PoolTypes.Pool = {
        id;
        name;
        dex;
        apy;
        volume24h;
        fees24h;
        tvl;
        priceVolatility;
        compositeScore = 0.0;
      };
      { pool with compositeScore = computeCompositeScore(pool) };
    });
  };
};
