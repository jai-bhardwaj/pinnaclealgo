"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTable } from "./components/order-table";
import {
  BarChart3,
  Activity,
  CheckCircle,
  Clock,
  IndianRupee,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useOrders,
  useOrdersSummary,
  usePlaceOrder,
} from "@/hooks/useTradingApi";

function OrderPage() {
  const { user } = useUser();
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useOrders(user?.id || "", {
    limit: 50,
    offset: 0,
  });
  const { data: ordersSummary } = useOrdersSummary(user?.id || "");
  const placeOrder = usePlaceOrder();
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
  const summaryStats = ordersSummary
    ? {
        total_orders: ordersSummary.total_orders,
        completed_orders: ordersSummary.completed_orders,
        open_orders: ordersSummary.open_orders,
        total_value: ordersSummary.total_value,
      }
    : {
        total_orders: 0,
        completed_orders: 0,
        open_orders: 0,
        total_value: 0,
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
            <p className="text-gray-600">Please log in to view your orders.</p>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
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
                Orders
              </h1>
            </div>
            <p className="text-gray-500">
              Manage and track your trading orders
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
              <span>New Order</span>
            </Button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Show:</span>
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="all">All Orders</option>
            <option value="open">Open Orders</option>
            <option value="completed">Completed Orders</option>
            <option value="cancelled">Cancelled Orders</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-gray-900">
                {summaryStats.total_orders}
              </div>
              <p className="text-xs text-gray-500">All time orders</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-green-600">
                {summaryStats.completed_orders}
              </div>
              <p className="text-xs text-gray-500">Successfully executed</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Open Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-orange-600">
                {summaryStats.open_orders}
              </div>
              <p className="text-xs text-gray-500">Pending execution</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-gray-900">
                ₹{summaryStats.total_value?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-gray-500">Order value</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <OrderTable
              orders={ordersData?.data || []}
              isLoading={isLoading}
              error={error ? String(error) : null}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OrderPage;
