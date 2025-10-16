// React Query hooks for Trading API
// Provides typed hooks for all trading backend endpoints

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingApi } from "@/services/tradingApi";
import type { OrderRequest, UpdateUserStrategyConfigRequest } from "@/types";

// === QUERY HOOKS ===

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => tradingApi.checkHealth(),
    refetchInterval: 30000, // Check health every 30 seconds
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: () => tradingApi.getStrategies(),
  });
}

export function useStrategy(strategyId: string) {
  return useQuery({
    queryKey: ["strategy", strategyId],
    queryFn: () => tradingApi.getStrategy(strategyId),
    enabled: !!strategyId,
  });
}

export function useMarketplace() {
  return useQuery({
    queryKey: ["marketplace"],
    queryFn: () => tradingApi.getMarketplace(),
  });
}

export function usePositions(userId: string) {
  return useQuery({
    queryKey: ["positions", userId],
    queryFn: () => tradingApi.getPositions(userId),
    enabled: !!userId,
  });
}

export function usePosition(userId: string, symbol: string) {
  return useQuery({
    queryKey: ["position", userId, symbol],
    queryFn: () => tradingApi.getPosition(userId, symbol),
    enabled: !!userId && !!symbol,
  });
}

export function useOrders(
  userId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    symbol?: string;
  }
) {
  return useQuery({
    queryKey: ["orders", userId, params],
    queryFn: () => tradingApi.getUserOrders(userId, params),
    enabled: !!userId,
  });
}

export function useOrdersSummary(
  userId: string,
  params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    symbol?: string;
  }
) {
  return useQuery({
    queryKey: ["ordersSummary", userId, params],
    queryFn: () => tradingApi.getOrdersSummary(userId, params),
    enabled: !!userId,
  });
}

export function useTrades(userId: string) {
  return useQuery({
    queryKey: ["trades", userId],
    queryFn: () => tradingApi.getTrades(userId),
    enabled: !!userId,
  });
}

export function useTradesBySymbol(userId: string, symbol: string) {
  return useQuery({
    queryKey: ["trades", userId, symbol],
    queryFn: () => tradingApi.getTradesBySymbol(userId, symbol),
    enabled: !!userId && !!symbol,
  });
}

export function useUserConfigs(userId: string) {
  return useQuery({
    queryKey: ["userConfigs", userId],
    queryFn: () => tradingApi.getUserConfigs(userId),
    enabled: !!userId,
  });
}

export function useUserConfig(userId: string, strategyId: string) {
  return useQuery({
    queryKey: ["userConfig", userId, strategyId],
    queryFn: () => tradingApi.getUserConfig(userId, strategyId),
    enabled: !!userId && !!strategyId,
  });
}

export function useDashboard(userId: string) {
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => tradingApi.getDashboard(userId),
    enabled: !!userId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

// === MUTATION HOOKS ===

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: OrderRequest) => tradingApi.placeOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateUserConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      strategyId,
      config,
    }: {
      userId: string;
      strategyId: string;
      config: UpdateUserStrategyConfigRequest;
    }) => tradingApi.updateUserConfig(userId, strategyId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userConfigs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useActivateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      strategyId,
      allocationAmount,
    }: {
      strategyId: string;
      allocationAmount?: number;
    }) => tradingApi.activateStrategy(strategyId, allocationAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeactivateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) =>
      tradingApi.deactivateStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function usePauseStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => tradingApi.pauseStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useResumeStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (strategyId: string) => tradingApi.resumeStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
