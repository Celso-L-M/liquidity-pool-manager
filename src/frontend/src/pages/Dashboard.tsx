import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  timestampToDate,
  useGetAllocations,
  useListNotifications,
  useListPools,
  useListRebalanceHistory,
  useListTrackedPools,
  useMarkNotificationRead,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType, Pool } from "@/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  Droplets,
  Gauge,
  Layers,
  TrendingUp,
  Wallet,
} from "lucide-react";

const NOTIFICATION_META: Record<
  NotificationType,
  { label: string; tone: "warning" | "destructive" | "secondary" }
> = {
  impermanentLossRisk: { label: "IL Risk", tone: "warning" },
  liquidityWithdrawn: { label: "Liquidity Withdrawn", tone: "destructive" },
  liquidityRemoved: { label: "Liquidity Removed", tone: "destructive" },
};

function formatPercent(value: bigint): string {
  return `${Number(value)}%`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatApy(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex items-start justify-between px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="font-metric mt-1 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: pools = [], isLoading: poolsLoading } = useListPools();
  const { data: trackedPools = [], isLoading: trackedLoading } =
    useListTrackedPools();
  const { data: allocations = [], isLoading: allocationsLoading } =
    useGetAllocations();
  const { data: notifications = [], isLoading: notificationsLoading } =
    useListNotifications();
  const { data: rebalanceHistory = [] } = useListRebalanceHistory();
  const markRead = useMarkNotificationRead();

  const poolById = new Map<string, Pool>(pools.map((p) => [p.id, p]));

  const tracked = trackedPools
    .map((t) => poolById.get(t.poolId))
    .filter((p): p is Pool => Boolean(p));

  const kpiLoading = poolsLoading || trackedLoading;

  const avgApy = tracked.length
    ? tracked.reduce((sum, p) => sum + p.apy, 0) / tracked.length
    : 0;
  const totalTvl = tracked.reduce((sum, p) => sum + p.tvl, 0);
  const totalVolume = tracked.reduce((sum, p) => sum + p.volume24h, 0);
  const totalFees = tracked.reduce((sum, p) => sum + p.fees24h, 0);

  const allocationByPool = new Map(allocations.map((a) => [a.poolId, a]));

  const allocationRows = trackedPools.map((t) => {
    const pool = poolById.get(t.poolId);
    const view = allocationByPool.get(t.poolId);
    return { pool, view };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: bigint) => {
    markRead.mutate(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Portfolio health, allocation targets, and liquidity alerts.
        </p>
      </div>

      {/* KPI cards */}
      <section
        aria-label="Key metrics"
        data-ocid="dashboard.kpis"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Avg APY"
          value={formatApy(avgApy)}
          icon={TrendingUp}
          accent="bg-success/15 text-success"
          loading={kpiLoading}
        />
        <KpiCard
          label="24h TVL"
          value={formatUsd(totalTvl)}
          icon={Wallet}
          accent="bg-accent/15 text-accent"
          loading={kpiLoading}
        />
        <KpiCard
          label="24h Volume"
          value={formatUsd(totalVolume)}
          icon={Layers}
          accent="bg-primary/15 text-primary"
          loading={kpiLoading}
        />
        <KpiCard
          label="24h Fees"
          value={formatUsd(totalFees)}
          icon={Droplets}
          accent="bg-warning/15 text-warning"
          loading={kpiLoading}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Allocations */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              Allocation Targets
            </CardTitle>
            <CardDescription>
              Target allocation per tracked pool. Sums to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {allocationsLoading || trackedLoading ? (
              <div className="flex flex-col gap-4">
                {["a", "b", "c"].map((k) => (
                  <Skeleton key={k} className="h-12 w-full" />
                ))}
              </div>
            ) : allocationRows.length === 0 ? (
              <div
                data-ocid="dashboard.allocations.empty_state"
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center"
              >
                <Gauge className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No tracked pools yet</p>
                <p className="text-xs text-muted-foreground">
                  Add pools from the Optimizer to set allocation targets.
                </p>
              </div>
            ) : (
              allocationRows.map(({ pool, view }, index) => {
                const current = view ? Number(view.currentPercent) : 0;
                const target = view ? Number(view.targetPercent) : 0;
                const deviation = view ? Number(view.deviation) : 0;
                const over = deviation > 0;
                return (
                  <div
                    key={pool?.id ?? index}
                    data-ocid={`dashboard.allocation.item.${index}`}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {pool?.name ?? "Unknown pool"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pool?.dex ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-metric text-xs",
                            over ? "text-destructive" : "text-success",
                          )}
                        >
                          {over ? "+" : ""}
                          {deviation.toFixed(1)}%
                        </span>
                        <span className="font-metric text-sm font-semibold">
                          {target.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        role="progressbar"
                        tabIndex={-1}
                        aria-valuenow={target}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pool?.name ?? "Pool"} target allocation`}
                        className="h-2 w-full overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                          style={{ width: `${Math.min(target, 100)}%` }}
                        />
                      </div>
                      <span className="font-metric w-16 shrink-0 text-right text-xs text-muted-foreground">
                        {current.toFixed(1)}% now
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Liquidity extraction and risk alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {notificationsLoading ? (
              <div className="flex flex-col gap-2">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-14 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div
                data-ocid="dashboard.notifications.empty_state"
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center"
              >
                <Bell className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground">
                  Alerts about your tracked pools will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n, index) => {
                const meta = NOTIFICATION_META[n.kind];
                const pool = poolById.get(n.poolId);
                return (
                  <div
                    key={n.id.toString()}
                    data-ocid={`dashboard.notification.item.${index}`}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                      n.read ? "bg-card" : "border-primary/40 bg-muted/40",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        meta.tone === "warning" && "bg-warning/15 text-warning",
                        meta.tone === "destructive" &&
                          "bg-destructive/15 text-destructive",
                        meta.tone === "secondary" &&
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {meta.tone === "warning" ? (
                        <AlertTriangle className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {meta.label}
                        </p>
                        {!n.read && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {pool?.name ?? n.poolId} · {formatTime(n.at)}
                      </p>
                    </div>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        aria-label="Mark notification as read"
                        data-ocid={`dashboard.notification.mark_read.${index}`}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rebalance history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="size-4 text-primary" />
            Rebalance History
          </CardTitle>
          <CardDescription>
            Recent rebalancing actions and their allocation changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rebalanceHistory.length === 0 ? (
            <div
              data-ocid="dashboard.rebalance.empty_state"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center"
            >
              <ArrowUpRight className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No rebalances yet</p>
              <p className="text-xs text-muted-foreground">
                Trigger a rebalance from the Allocations page.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {rebalanceHistory.map((record, index) => (
                <li
                  key={record.id.toString()}
                  data-ocid={`dashboard.rebalance.item.${index}`}
                  className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-metric text-xs text-muted-foreground">
                      {formatTime(record.at)}
                    </span>
                    <Badge variant="secondary">
                      {record.changes.length} change
                      {record.changes.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {record.changes.map((change) => {
                      const pool = poolById.get(change.poolId);
                      return (
                        <span
                          key={change.poolId}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {pool?.name ?? change.poolId}:{" "}
                          <span className="font-metric text-foreground">
                            {formatPercent(change.fromPercent)} →{" "}
                            {formatPercent(change.toPercent)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
