import Layout from "@/components/Layout";
import Allocations from "@/pages/Allocations";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import Optimizer from "@/pages/Optimizer";
import Settings from "@/pages/Settings";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated } = useInternetIdentity();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Layout />;
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const optimizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/optimizer",
  component: Optimizer,
});

const allocationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/allocations",
  component: Allocations,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: Notifications,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  optimizerRoute,
  allocationsRoute,
  notificationsRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
