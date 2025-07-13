"use client";

import { useEffect } from "react";
import { observer } from "mobx-react-lite";
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
import { Select as ShadSelect, SelectTrigger as ShadSelectTrigger, SelectContent as ShadSelectContent, SelectItem as ShadSelectItem, SelectValue as ShadSelectValue } from "@/components/ui/select";
import { orderPageModel } from "./models/OrderPageModel";
import { MODES } from "./models/types";

const OrderPage = observer(() => {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      orderPageModel.initialize(user.id);
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
            <p className="text-gray-600">Please log in to view your orders.</p>
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
              onClick={() => orderPageModel.refresh()}
              disabled={orderPageModel.isRefreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${orderPageModel.isRefreshing ? "animate-spin" : ""}`}
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
          <ShadSelect 
            value={orderPageModel.filters.mode} 
            onValueChange={(value) => orderPageModel.setMode(value)}
          >
            <ShadSelectTrigger className="w-40 border-gray-300">
              <ShadSelectValue />
            </ShadSelectTrigger>
            <ShadSelectContent>
              {MODES.map((m) => (
                <ShadSelectItem key={m.value} value={m.value}>{m.label}</ShadSelectItem>
              ))}
            </ShadSelectContent>
          </ShadSelect>
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
                {orderPageModel.summaryStats.total_orders}
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
                {orderPageModel.summaryStats.completed_orders}
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
                {orderPageModel.summaryStats.open_orders}
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
                ₹{orderPageModel.summaryStats.total_value?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-500">Order value</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <OrderTable
              orders={orderPageModel.orders}
              isLoading={orderPageModel.isLoadingOrders && (!orderPageModel.isRefreshing || orderPageModel.isManualRefresh)}
              error={orderPageModel.ordersError}
              // Pagination
              currentPage={orderPageModel.pagination.currentPage}
              totalPages={orderPageModel.pagination.totalPages}
              totalItems={orderPageModel.pagination.totalItems}
              pageSize={orderPageModel.pagination.pageSize}
              onPageChange={(page) => orderPageModel.setCurrentPage(page)}
              onPageSizeChange={(pageSize) => orderPageModel.setPageSize(pageSize)}
              // Search and filters
              searchQuery={orderPageModel.filters.searchQuery}
              onSearchChange={(query) => orderPageModel.setSearchQuery(query)}
              statusFilter={orderPageModel.filters.statusFilter}
              onStatusFilterChange={(status) => orderPageModel.setStatusFilter(status)}
              // Actions
              onRefresh={() => orderPageModel.refresh()}
              onExport={() => console.log("Export orders")}
              highlightNewRows={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default OrderPage;
