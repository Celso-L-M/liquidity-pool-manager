import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  timestampToDate,
  useGetAllocations,
  useListPools,
  useListRebalanceHistory,
  useListTrackedPools,
  useSetAllocations,
  useTriggerRebalance,
} from "@/hooks/useQueries";
import type { Allocation, Pool } from "@/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  PieChart,
  RefreshCw,
  Scale,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type DeviationTone = "onTarget" | "low" | "medium" | "high";

function deviationTone(deviation: number): DeviationTone {
  if (deviation === 0) return "onTarget";
  if (deviation <= 5) return "low";
  if (deviation <= 15) return "medium";
  return "high";
}

const TONE_BADGE: Record<DeviationTone, string> = {
  onTarget: "bg-success/15 text-success",
  low: "bg-accent/15 text-accent",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

const TONE_BAR: Record<DeviationTone, string> = {
  onTarget: "bg-success",
  low: "bg-accent",
  medium: "bg-warning",
  high: "bg-destructive",
};

const TONE_LABEL: Record<DeviationTone, string> = {
  onTarget: "On target",
  low: "Low deviation",
  medium: "Medium risk",
  high: "High risk",
};

function formatPercent(value: bigint | number): string {
  return `${Number(value).toFixed(1)}%`;
}

export default function Allocations() {
  const { data: allocations = [], isLoading: allocationsLoading } =
    useGetAllocations();
  const { data: trackedPools = [], isLoading: trackedLoading } =
    useListTrackedPools();
  const { data: pools = [] } = useListPools();
  const { data: history } = useListRebalanceHistory();
  const setAllocations = useSetAllocations();
  const triggerRebalance = useTriggerRebalance();

  const poolById = useMemo(
    () => new Map<string, Pool>(pools.map((p) => [p.id, p])),
    [pools],
  );

  const poolName = useMemo(() => {
    const map = new Map<string, string>();
    for (const pool of pools) map.set(pool.id, pool.name);
    return (id: string) => map.get(id) ?? id;
  }, [pools]);

  const allocationByPool = useMemo(
    () => new Map(allocations.map((a) => [a.poolId, a])),
    [allocations],
  );

  const tracked = trackedPools
    .map((t) => poolById.get(t.poolId))
    .filter((p): p is Pool => Boolean(p));

  const [targets, setTargets] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !allocations || allocations.length === 0) return;
    const next: Record<string, string> = {};
    for (const a of allocations) next[a.poolId] = String(a.targetPercent);
    setTargets(next);
    setInitialized(true);
  }, [allocations, initialized]);

  const sum = useMemo(() => {
    return Object.values(targets).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [targets]);

  const sumValid = Math.abs(sum - 100) < 0.001;

  const avgDeviation = useMemo(() => {
    if (tracked.length === 0) return 0;
    const total = tracked.reduce((acc, pool) => {
      const view = allocationByPool.get(pool.id);
      return acc + Math.abs(Number(view?.deviation ?? 0));
    }, 0);
    return total / tracked.length;
  }, [tracked, allocationByPool]);

  const handleSaveTargets = () => {
    if (!sumValid) return;
    const payload: Allocation[] = Object.entries(targets).map(
      ([poolId, value]) => ({
        poolId,
        targetPercent: BigInt(Math.round(Number(value))),
      }),
    );
    setAllocations.mutate(payload, {
      onSuccess: () => toast.success("Target allocations saved"),
      onError: () => toast.error("Failed to save target allocations"),
    });
  };

  const handleRebalance = () => {
    triggerRebalance.mutate(undefined, {
      onSuccess: () => toast.success("Rebalancing executed"),
      onError: () => toast.error("Rebalancing failed"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PieChart className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Allocations
            </h1>
            <p className="text-sm text-muted-foreground">
              Set target weights and rebalance your tracked pools.
            </p>
          </div>
        </div>
        <Button
          data-ocid="rebalance_button"
          onClick={handleRebalance}
          disabled={triggerRebalance.isPending}
        >
          {triggerRebalance.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          {triggerRebalance.isPending ? "Rebalancing..." : "Trigger rebalance"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-ocid="kpi_tracked">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Target className="size-3.5" /> Tracked pools
            </CardDescription>
            <CardTitle className="font-metric text-2xl">
              {trackedPools ? trackedPools.length : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card data-ocid="kpi_target_sum">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Scale className="size-3.5" /> Target sum
            </CardDescription>
            <CardTitle
              className={`font-metric text-2xl ${
                sumValid ? "text-success" : "text-warning"
              }`}
            >
              {sum.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card data-ocid="kpi_avg_deviation">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <ArrowUpRight className="size-3.5" /> Avg deviation
            </CardDescription>
            <CardTitle className="font-metric text-2xl">
              {tracked.length > 0 ? `${avgDeviation.toFixed(1)}%` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card data-ocid="kpi_rebalances">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <RefreshCw className="size-3.5" /> Rebalances
            </CardDescription>
            <CardTitle className="font-metric text-2xl">
              {history ? history.length : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card data-ocid="allocations_panel">
        <CardHeader>
          <CardTitle>Target allocation</CardTitle>
          <CardDescription>
            Set the target weight for each tracked pool. Targets must sum to
            100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {allocationsLoading || trackedLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : tracked.length === 0 ? (
            <div
              data-ocid="allocations_empty_state"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center"
            >
              <PieChart className="size-8 text-muted-foreground/50" />
              <p className="max-w-sm text-sm text-muted-foreground">
                No tracked pools yet. Add pools to your dashboard to configure
                target allocations.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pool</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Target %</TableHead>
                  <TableHead>Deviation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracked.map((pool, i) => {
                  const view = allocationByPool.get(pool.id);
                  const deviation = Number(view?.deviation ?? 0);
                  const currentPercent = Number(view?.currentPercent ?? 0);
                  const tone = deviationTone(deviation);
                  const target =
                    targets[pool.id] ?? String(view?.targetPercent ?? 0);
                  return (
                    <TableRow key={pool.id} data-ocid={`allocation.row.${i}`}>
                      <TableCell className="font-medium">{pool.name}</TableCell>
                      <TableCell className="text-right font-metric text-muted-foreground">
                        {formatPercent(currentPercent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            data-ocid={`allocation.input.${i}`}
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={target}
                            onChange={(e) =>
                              setTargets((prev) => ({
                                ...prev,
                                [pool.id]: e.target.value,
                              }))
                            }
                            className="h-8 w-24 text-right font-metric"
                            aria-label={`Target allocation for ${pool.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${TONE_BAR[tone]}`}
                              style={{
                                width: `${Math.min(100, Math.abs(deviation) * 2)}%`,
                              }}
                            />
                          </div>
                          <Badge
                            variant="secondary"
                            className={TONE_BADGE[tone]}
                          >
                            {deviation > 0 ? (
                              <ArrowUpRight className="mr-1 size-3" />
                            ) : deviation < 0 ? (
                              <ArrowDownRight className="mr-1 size-3" />
                            ) : (
                              <CheckCircle2 className="mr-1 size-3" />
                            )}
                            {TONE_LABEL[tone]}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Target sum:</span>
              <span
                data-ocid="target_sum"
                className={`font-metric font-semibold ${
                  sumValid ? "text-success" : "text-warning"
                }`}
              >
                {sum.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">/ 100%</span>
              {!sumValid && (
                <span
                  data-ocid="target_sum_error"
                  className="text-xs text-warning"
                >
                  Targets must sum to 100%
                </span>
              )}
            </div>
            <Button
              data-ocid="save_allocations_button"
              onClick={handleSaveTargets}
              disabled={!sumValid || setAllocations.isPending}
            >
              {setAllocations.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}
              {setAllocations.isPending ? "Saving..." : "Save targets"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-ocid="rebalance_history_panel">
        <CardHeader>
          <CardTitle>Rebalancing history</CardTitle>
          <CardDescription>
            Recorded rebalancing actions and the resulting allocation changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div
              data-ocid="rebalance_history_empty"
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center"
            >
              <RefreshCw className="size-8 text-muted-foreground/50" />
              <p className="max-w-sm text-sm text-muted-foreground">
                No rebalancing actions recorded yet. Trigger a rebalance to move
                your current allocations toward your targets.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record, ri) => {
                  const date = timestampToDate(record.at);
                  return record.changes.map((change, ci) => (
                    <TableRow
                      key={`${record.id}-${ci}`}
                      data-ocid={`rebalance.row.${ri}`}
                    >
                      {ci === 0 ? (
                        <TableCell
                          rowSpan={record.changes.length}
                          className="align-top font-metric text-xs text-muted-foreground"
                        >
                          {date ? date.toLocaleString() : "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-medium">
                        {poolName(change.poolId)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-metric text-muted-foreground">
                          {formatPercent(change.fromPercent)}
                        </span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="font-metric font-semibold text-accent">
                          {formatPercent(change.toPercent)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
