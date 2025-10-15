"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyTable } from "./components/strategy-table";
import {
  BarChart3,
  Activity,
  Play,
  Pause,
  Square,
  IndianRupee,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useStrategies,
  useActivateStrategy,
  useDeactivateStrategy,
  usePauseStrategy,
} from "@/hooks/useTradingApi";

function StrategiesPage() {
  const { user } = useUser();
  const { data: strategies, isLoading, error, refetch } = useStrategies();
  const activateStrategy = useActivateStrategy();
  const deactivateStrategy = useDeactivateStrategy();
  const pauseStrategy = usePauseStrategy();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Calculate summary stats
  const summaryStats = strategies
    ? {
        total_strategies: strategies.length,
        active_strategies: strategies.filter((s) => s.enabled).length,
        paused_strategies: strategies.filter((s) => !s.enabled).length,
        total_pnl: 0, // Will be calculated from positions/trades when available
      }
    : {
        total_strategies: 0,
        active_strategies: 0,
        paused_strategies: 0,
        total_pnl: 0,
      };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <div className="h-12 w-12 text-blue-500 mx-auto mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to view your trading strategies.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Error Loading Strategies
            </h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Strategies
              </h1>
            </div>
            <p className="text-gray-500">
              Manage and monitor your automated trading strategies
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              <span>New Strategy</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Total Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-gray-900">
                {summaryStats.total_strategies}
              </div>
              <p className="text-xs text-gray-500">All strategies</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Play className="h-4 w-4 mr-2" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-green-600">
                {summaryStats.active_strategies}
              </div>
              <p className="text-xs text-gray-500">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Pause className="h-4 w-4 mr-2" />
                Paused
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-orange-600">
                {summaryStats.paused_strategies}
              </div>
              <p className="text-xs text-gray-500">Temporarily stopped</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                Total PnL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-light ${
                  summaryStats.total_pnl >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ₹{summaryStats.total_pnl?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500">All strategies</p>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <StrategyTable
              strategies={strategies || []}
              isLoading={isLoading}
              error={error ? String(error) : null}
              onRefresh={handleRefresh}
              onStartStrategy={async (strategyId) => {
                try {
                  await activateStrategy.mutateAsync({ strategyId });
                } catch (error) {
                  console.error("Failed to start strategy:", error);
                }
              }}
              onStopStrategy={async (strategyId) => {
                try {
                  await deactivateStrategy.mutateAsync(strategyId);
                } catch (error) {
                  console.error("Failed to stop strategy:", error);
                }
              }}
              onPauseStrategy={async (strategyId) => {
                try {
                  await pauseStrategy.mutateAsync(strategyId);
                } catch (error) {
                  console.error("Failed to pause strategy:", error);
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StrategiesPage;
