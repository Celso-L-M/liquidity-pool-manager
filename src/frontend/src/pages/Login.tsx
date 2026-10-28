import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Activity,
  ArrowRight,
  Gauge,
  PieChart,
  ShieldCheck,
  Waves,
} from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    title: "Optimizer scoring",
    description:
      "Rank liquidity pools by APY, fees, and impermanent-loss risk in one view.",
  },
  {
    icon: PieChart,
    title: "Target allocations",
    description:
      "Set and track your liquidity allocation across every tracked pool.",
  },
  {
    icon: ShieldCheck,
    title: "Private dashboard",
    description:
      "Your pools, allocations, and alerts stay isolated to your account.",
  },
];

export default function Login() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const disabled = isInitializing || isLoggingIn;

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="bg-gradient-subtle pointer-events-none absolute inset-x-0 top-0 h-72" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
            <Waves className="size-5" />
          </div>
          <span className="font-display text-base font-bold tracking-tight">
            Liquidity Terminal
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
            <Activity className="size-3.5 text-primary" />
            DeFi Liquidity Manager
          </span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-12 py-16 md:flex-row md:gap-16">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Liquidity Pool Manager
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Manage your liquidity
              <span className="text-gradient-primary">
                {" "}
                like a trading desk.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              Track pool APY, fees, and impermanent-loss risk, set target
              allocations, and stay ahead of liquidity changes — all from a
              private, per-user dashboard.
            </p>

            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => login()}
                disabled={disabled}
                data-ocid="login_button"
                className="gap-2 bg-gradient-primary shadow-elevated hover:shadow-elevated"
              >
                {isLoggingIn
                  ? "Opening sign-in…"
                  : "Sign in with Internet Identity"}
                {!isLoggingIn && <ArrowRight className="size-4" />}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                {isInitializing
                  ? "Preparing secure sign-in…"
                  : "Your dashboard is private and visible only to you."}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-lg border border-border bg-card p-5 shadow-subtle"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
