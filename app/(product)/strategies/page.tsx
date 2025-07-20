"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { strategyPageModel } from "./models/StrategyPageModel";

const StrategiesPage = observer(() => {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      strategyPageModel.initialize(user.id);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <div className="h-12 w-12 text-blue-500 mx-auto mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please log in to view your trading strategies.</p>
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
              onClick={() => strategyPageModel.refresh()}
              disabled={strategyPageModel.isRefreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${strategyPageModel.isRefreshing ? "animate-spin" : ""}`}
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
                {strategyPageModel.summaryStats.total_strategies}
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
                {strategyPageModel.summaryStats.active_strategies}
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
                {strategyPageModel.summaryStats.paused_strategies}
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
              <div className={`text-2xl font-light ${strategyPageModel.summaryStats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{strategyPageModel.summaryStats.total_pnl?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500">All strategies</p>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <StrategyTable
              strategies={strategyPageModel.filteredStrategies}
              isLoading={strategyPageModel.isLoadingStrategies && (!strategyPageModel.isRefreshing || strategyPageModel.isManualRefresh)}
              error={strategyPageModel.strategiesError}
              // Pagination
              currentPage={strategyPageModel.pagination.currentPage}
              totalPages={strategyPageModel.pagination.totalPages}
              totalItems={strategyPageModel.pagination.totalItems}
              pageSize={strategyPageModel.pagination.pageSize}
              onPageChange={(page) => strategyPageModel.setCurrentPage(page)}
              onPageSizeChange={(pageSize) => strategyPageModel.setPageSize(pageSize)}
              // Search and filters
              searchQuery={strategyPageModel.filters.searchQuery}
              onSearchChange={(query) => strategyPageModel.setSearchQuery(query)}
              statusFilter={strategyPageModel.filters.statusFilter}
              onStatusFilterChange={(status) => strategyPageModel.setStatusFilter(status)}
              assetClassFilter={strategyPageModel.filters.assetClassFilter}
              onAssetClassFilterChange={(assetClass) => strategyPageModel.setAssetClassFilter(assetClass)}
              strategyTypeFilter={strategyPageModel.filters.strategyTypeFilter}
              onStrategyTypeFilterChange={(strategyType) => strategyPageModel.setStrategyTypeFilter(strategyType)}
              // Actions
              onRefresh={() => strategyPageModel.refresh()}
              onExport={() => console.log("Export strategies")}
              onStartStrategy={async (strategyId) => {
                try {
                  await strategyPageModel.startStrategy(strategyId);
                } catch (error) {
                  console.error("Failed to start strategy:", error);
                }
              }}
              onStopStrategy={async (strategyId) => {
                try {
                  await strategyPageModel.stopStrategy(strategyId);
                } catch (error) {
                  console.error("Failed to stop strategy:", error);
                }
              }}
              onPauseStrategy={async (strategyId) => {
                try {
                  await strategyPageModel.pauseStrategy(strategyId);
                } catch (error) {
                  console.error("Failed to pause strategy:", error);
                }
              }}
              onEditStrategy={(strategy) => console.log("Edit strategy:", strategy)}
              onDeleteStrategy={(strategyId) => console.log("Delete strategy:", strategyId)}
              highlightNewRows={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default StrategiesPage;
