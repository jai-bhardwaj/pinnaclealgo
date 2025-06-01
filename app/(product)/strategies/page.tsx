"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import StrategyTable from "@/app/components/StrategyTable";
import { useStrategyStore } from "@/stores";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";

const StrategiesPage = observer(() => {
  const { user } = useUser();
  const strategyStore = useStrategyStore();

  useEffect(() => {
    if (user?.id) {
      strategyStore.fetchStrategies(user.id);
    }
  }, [user?.id, strategyStore]);

  const handleRefresh = () => {
    if (user?.id) {
      strategyStore.fetchStrategies(user.id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
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
              disabled={strategyStore.isLoading}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  strategyStore.isLoading ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </Button>

            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              <span>New Strategy</span>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {strategyStore.error && (
          <Card className="bg-white border border-red-200 shadow-sm">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <p className="text-red-700">{strategyStore.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => strategyStore.clearError()}
                className="ml-auto border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Strategy Table */}
        <StrategyTable
          strategies={strategyStore.strategies}
          isLoading={strategyStore.isLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
});

export default StrategiesPage;
