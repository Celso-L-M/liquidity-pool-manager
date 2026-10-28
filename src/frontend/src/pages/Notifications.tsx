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
import { Switch } from "@/components/ui/switch";
import {
  timestampToDate,
  useGetAlertPreferences,
  useListNotifications,
  useListPools,
  useMarkNotificationRead,
  useUpdateAlertPreferences,
} from "@/hooks/useQueries";
import type { AlertPreferences, Notification, NotificationType } from "@/types";
import {
  Bell,
  Check,
  CheckCheck,
  Mail,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { useMemo } from "react";

const TYPE_META: Record<
  NotificationType,
  {
    label: string;
    badge: "destructive" | "warning" | "secondary";
    icon: typeof Waves;
  }
> = {
  liquidityRemoved: {
    label: "Liquidity Removed",
    badge: "destructive",
    icon: Waves,
  },
  liquidityWithdrawn: {
    label: "Liquidity Withdrawn",
    badge: "warning",
    icon: Waves,
  },
  impermanentLossRisk: {
    label: "Impermanent-Loss Risk",
    badge: "secondary",
    icon: ShieldAlert,
  },
};

const PREFERENCE_ROWS: {
  key: keyof AlertPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "liquidityRemoved",
    label: "Liquidity removed",
    description: "Alert when liquidity is removed from a tracked pool.",
  },
  {
    key: "liquidityWithdrawn",
    label: "Liquidity withdrawn",
    description: "Alert when liquidity is withdrawn from a tracked pool.",
  },
  {
    key: "impermanentLossRisk",
    label: "Impermanent-loss risk",
    description: "Alert when price volatility signals extraction risk.",
  },
];

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

export default function Notifications() {
  const { data: notifications = [], isLoading: loadingNotifications } =
    useListNotifications();
  const { data: pools = [] } = useListPools();
  const { data: prefs, isLoading: loadingPrefs } = useGetAlertPreferences();
  const markRead = useMarkNotificationRead();
  const updatePrefs = useUpdateAlertPreferences();

  const poolNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const pool of pools) {
      map.set(pool.id, pool.name);
    }
    return map;
  }, [pools]);

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (a.at === b.at) return 0;
        return a.at > b.at ? -1 : 1;
      }),
    [notifications],
  );

  const unreadCount = useMemo(
    () => sorted.filter((n) => !n.read).length,
    [sorted],
  );

  const handleMarkRead = (notification: Notification) => {
    if (notification.read) return;
    markRead.mutate(notification.id);
  };

  const handleMarkAllRead = () => {
    for (const notification of sorted) {
      if (!notification.read) {
        markRead.mutate(notification.id);
      }
    }
  };

  const handleTogglePreference = (key: keyof AlertPreferences) => {
    if (!prefs) return;
    updatePrefs.mutate({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Liquidity extraction alerts and delivery preferences for your private
          dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Notification center */}
        <Card className="gap-0 overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </div>
                <div>
                  <CardTitle className="font-display">
                    Notification Center
                  </CardTitle>
                  <CardDescription>
                    {unreadCount > 0
                      ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                      : "All caught up"}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markRead.isPending}
                data-ocid="notifications.mark_all_read_button"
              >
                <CheckCheck className="size-4" />
                Mark all read
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingNotifications ? (
              <div
                className="flex flex-col gap-3 p-4"
                data-ocid="notifications.loading_state"
              >
                {["a", "b", "c", "d"].map((k) => (
                  <div
                    key={k}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Skeleton className="size-9 rounded-md" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
                data-ocid="notifications.empty_state"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="size-6" />
                </div>
                <div>
                  <p className="font-display font-semibold">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Extraction and impermanent-loss alerts will appear here as
                    they are detected.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {sorted.map((notification, index) => {
                  const meta = TYPE_META[notification.kind];
                  const Icon = meta.icon;
                  const poolName = poolNameById.get(notification.poolId);
                  return (
                    <li
                      key={notification.id.toString()}
                      className={`flex items-start gap-3 p-4 transition-colors ${
                        notification.read
                          ? "bg-transparent"
                          : "bg-primary/[0.03]"
                      }`}
                      data-ocid={`notifications.item.${index + 1}`}
                    >
                      <div
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md ${
                          meta.badge === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : meta.badge === "warning"
                              ? "bg-warning/10 text-warning"
                              : "bg-accent/10 text-accent"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              meta.badge === "destructive"
                                ? "destructive"
                                : meta.badge === "warning"
                                  ? "outline"
                                  : "secondary"
                            }
                            className={
                              meta.badge === "warning"
                                ? "border-warning/40 text-warning"
                                : ""
                            }
                          >
                            {meta.label}
                          </Badge>
                          {!notification.read && (
                            <span
                              className="size-1.5 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}
                        </div>
                        <p className="mt-1.5 truncate text-sm font-medium">
                          {poolName ?? notification.poolId}
                        </p>
                        <p className="mt-0.5 font-metric text-xs text-muted-foreground">
                          {formatTime(notification.at)}
                        </p>
                      </div>

                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() => handleMarkRead(notification)}
                          disabled={markRead.isPending}
                          aria-label="Mark as read"
                          data-ocid={`notifications.mark_read_button.${index + 1}`}
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alert preferences */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Mail className="size-4" />
              </div>
              <div>
                <CardTitle className="font-display">
                  Alert Preferences
                </CardTitle>
                <CardDescription>
                  Choose which alerts you receive and how they are delivered.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {loadingPrefs || !prefs ? (
              <div
                className="flex flex-col gap-4"
                data-ocid="notifications.prefs.loading_state"
              >
                {["a", "b", "c", "d"].map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-5 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {PREFERENCE_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{row.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.description}
                        </p>
                      </div>
                      <Switch
                        checked={prefs[row.key]}
                        onCheckedChange={() => handleTogglePreference(row.key)}
                        disabled={updatePrefs.isPending}
                        aria-label={`Toggle ${row.label}`}
                        data-ocid={`notifications.prefs.${row.key}.toggle`}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Email delivery</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Send alerts to your verified email address.
                      </p>
                    </div>
                    <Switch
                      checked={prefs.emailDelivery}
                      onCheckedChange={() =>
                        handleTogglePreference("emailDelivery")
                      }
                      disabled={updatePrefs.isPending}
                      aria-label="Toggle email delivery"
                      data-ocid="notifications.prefs.email_delivery.toggle"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
