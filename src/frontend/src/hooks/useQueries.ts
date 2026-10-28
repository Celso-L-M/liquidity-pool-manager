import { createActor } from "@/backend";
import type { AllocationView } from "@/backend";
import type {
  AlertPreferences,
  Allocation,
  Credential,
  Notification,
  Pool,
  PoolId,
  RebalanceRecord,
  TrackedPool,
  UserRole,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useListPools() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      if (!actor) return [] as Pool[];
      return actor.listPools();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListTrackedPools() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["trackedPools"],
    queryFn: async () => {
      if (!actor) return [] as TrackedPool[];
      return actor.listTrackedPools();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllocations() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allocations"],
    queryFn: async () => {
      if (!actor) return [] as AllocationView[];
      return actor.listAllocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListNotifications() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [] as Notification[];
      return actor.listNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAlertPreferences() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["alertPreferences"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getPreferences();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListCredentials() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      if (!actor) return [] as Credential[];
      return actor.listCredentials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCredential() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cred: Credential) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addCredential(cred);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useUpdateCredential() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cred: Credential) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateCredential(cred);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useRemoveCredential() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeCredential(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["credentials"] });
    },
  });
}

export function useListRebalanceHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["rebalanceHistory"],
    queryFn: async () => {
      if (!actor) return [] as RebalanceRecord[];
      return actor.listRebalanceHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return "guest" as UserRole;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAllocations() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targets: Allocation[]) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setTarget(targets);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.markRead(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateAlertPreferences() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: AlertPreferences) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updatePreferences(prefs);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alertPreferences"] });
    },
  });
}

export function useAddTrackedPool() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolId: PoolId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addTrackedPool(poolId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trackedPools"] });
    },
  });
}

export function useRefreshPools() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.refreshPools();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pools"] });
    },
  });
}

export function useTriggerRebalance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.rebalance();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rebalanceHistory"] });
      void queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
}
