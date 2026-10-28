import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddTrackedPool,
  useListPools,
  useListTrackedPools,
  useRefreshPools,
} from "@/hooks/useQueries";
import type { Pool } from "@/types";
import {
  Activity,
  ArrowUpRight,
  Check,
  Gauge,
  Plus,
  RefreshCw,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RiskLevel = "Low" | "Medium" | "High";

function riskLevel(volatility: number): RiskLevel {
  if (volatility < 0.2) return "Low";
  if (volatility < 0.45) return "Medium";
  return "High";
}

function riskBadgeClass(risk: RiskLevel): string {
  switch (risk) {
    case "Low":
      return "border-transparent bg-success/15 text-success";
    case "Medium":
      return "border-transparent bg-warning/15 text-warning";
    case "High":
      return "border-transparent bg-destructive/15 text-destructive";
  }
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatVolatility(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function PoolDetail({
  pool,
  tracked,
  onTrack,
  isTracking,
}: {
  pool: Pool;
  tracked: boolean;
  onTrack: () => void;
  isTracking: boolean;
}) {
  const risk = riskLevel(pool.priceVolatility);
  const rows: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: "DEX", value: pool.dex },
    { label: "APY", value: formatPercent(pool.apy), accent: true },
    { label: "24h Volume", value: formatUsd(pool.volume24h) },
    { label: "24h Fees", value: formatUsd(pool.fees24h) },
    { label: "TVL", value: formatUsd(pool.tvl) },
    {
      label: "Price Volatility",
      value: formatVolatility(pool.priceVolatility),
    },
  ];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
            <Waves className="size-4" />
          </div>
          <div>
            <DialogTitle className="font-display">{pool.name}</DialogTitle>
            <DialogDescription>{pool.dex}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p
              className={`font-metric mt-1 text-lg font-semibold ${
                row.accent ? "text-success" : "text-foreground"
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">IL Risk</p>
          <Badge className={`mt-1 ${riskBadgeClass(risk)}`}>{risk}</Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-gradient-subtle p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Composite Score</span>
          <span className="font-metric text-2xl font-bold text-primary">
            {pool.compositeScore.toFixed(1)}
          </span>
        </div>
      </div>

      <Button
        data-ocid="pool.detail.track_button"
        onClick={onTrack}
        disabled={tracked || isTracking}
        className="w-full"
      >
        {tracked ? (
          <>
            <Check className="size-4" /> Tracked
          </>
        ) : isTracking ? (
          <>
            <RefreshCw className="size-4 animate-spin" /> Adding…
          </>
        ) : (
          <>
            <Plus className="size-4" /> Add to portfolio
          </>
        )}
      </Button>
    </DialogContent>
  );
}

export default function Optimizer() {
  const { data: pools = [], isLoading, isError, refetch } = useListPools();
  const { data: trackedPools = [] } = useListTrackedPools();
  const addTracked = useAddTrackedPool();
  const refresh = useRefreshPools();
  const [selected, setSelected] = useState<Pool | null>(null);

  const trackedIds = useMemo(
    () => new Set(trackedPools.map((t) => t.poolId)),
    [trackedPools],
  );

  const ranked = useMemo(
    () => [...pools].sort((a, b) => b.compositeScore - a.compositeScore),
    [pools],
  );

  const handleTrack = (pool: Pool) => {
    addTracked.mutate(pool.id, {
      onSuccess: () => {
        toast.success(`${pool.name} added to your portfolio`);
      },
      onError: () => {
        toast.error(`Could not add ${pool.name}`);
      },
    });
  };

  const handleRefresh = () => {
    refresh.mutate(undefined, {
      onSuccess: () => {
        toast.success("Pool data refreshed from GeckoTerminal");
      },
      onError: () => {
        toast.error("Refresh failed — please try again");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Pool Optimizer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rank liquidity pools by composite score across APY, volume, fees,
            TVL, and impermanent-loss risk.
          </p>
        </div>
        <Button
          data-ocid="optimizer.refresh_button"
          onClick={handleRefresh}
          disabled={refresh.isPending}
        >
          {refresh.isPending ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {refresh.isPending ? "Refreshing…" : "Refresh data"}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Gauge className="size-4 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>
              {ranked.length} pools ranked by composite optimizer score
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Activity className="size-3 text-primary" />
            Live
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" data-ocid="optimizer.loading_state">
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div
              data-ocid="optimizer.error_state"
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <TrendingUp className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load pool data.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : ranked.length === 0 ? (
            <div
              data-ocid="optimizer.empty_state"
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <Waves className="size-8 text-muted-foreground" />
              <p className="font-medium">No pools available yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Pull live DEX pool data from GeckoTerminal to start ranking
                opportunities.
              </p>
              <Button onClick={handleRefresh} disabled={refresh.isPending}>
                <RefreshCw className="size-4" />
                Fetch pools
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead className="text-right">APY</TableHead>
                    <TableHead className="text-right">24h Volume</TableHead>
                    <TableHead className="text-right">24h Fees</TableHead>
                    <TableHead className="text-right">TVL</TableHead>
                    <TableHead className="text-right">Volatility</TableHead>
                    <TableHead>IL Risk</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="w-24 text-right">Track</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((pool, index) => {
                    const risk = riskLevel(pool.priceVolatility);
                    const tracked = trackedIds.has(pool.id);
                    return (
                      <TableRow
                        key={pool.id}
                        data-ocid={`optimizer.row.${index + 1}`}
                        className="cursor-pointer"
                        onClick={() => setSelected(pool)}
                      >
                        <TableCell className="font-metric text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Waves className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {pool.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pool.dex}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-metric text-success">
                          {formatPercent(pool.apy)}
                        </TableCell>
                        <TableCell className="text-right font-metric">
                          {formatUsd(pool.volume24h)}
                        </TableCell>
                        <TableCell className="text-right font-metric">
                          {formatUsd(pool.fees24h)}
                        </TableCell>
                        <TableCell className="text-right font-metric">
                          {formatUsd(pool.tvl)}
                        </TableCell>
                        <TableCell className="text-right font-metric">
                          {formatVolatility(pool.priceVolatility)}
                        </TableCell>
                        <TableCell>
                          <Badge className={riskBadgeClass(risk)}>{risk}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-metric text-base font-bold text-primary">
                            {pool.compositeScore.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            data-ocid={`optimizer.track_button.${index + 1}`}
                            variant={tracked ? "secondary" : "outline"}
                            size="sm"
                            disabled={tracked}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrack(pool);
                            }}
                          >
                            {tracked ? (
                              <Check className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                            <span className="sr-only">
                              {tracked ? "Tracked" : "Track"} {pool.name}
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowUpRight className="size-3.5" />
        <span>
          Select any row to view full pool detail. Composite score blends APY,
          volume, fees, TVL, and volatility.
        </span>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <PoolDetail
            pool={selected}
            tracked={trackedIds.has(selected.id)}
            isTracking={addTracked.isPending}
            onTrack={() => handleTrack(selected)}
          />
        )}
      </Dialog>
    </div>
  );
}
