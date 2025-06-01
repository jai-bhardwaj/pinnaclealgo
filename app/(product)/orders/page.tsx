"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  BarChart3,
  Activity,
  Plus,
  Download,
  Calendar,
} from "lucide-react";

export default function OrdersPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders with real tRPC data
  const {
    data: ordersData,
    refetch: refetchOrders,
    isLoading,
  } = trpc.order.getByUserId.useQuery(
    {
      userId: user?.id || "",
      pagination: { page: 1, limit: 100 },
      filters:
        statusFilter !== "all"
          ? {
              status: statusFilter as
                | "ERROR"
                | "PENDING"
                | "PLACED"
                | "OPEN"
                | "COMPLETE"
                | "CANCELLED"
                | "REJECTED"
                | "UNKNOWN",
            }
          : {},
    },
    { enabled: !!user?.id }
  );

  const orders = ordersData?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(
    (order) =>
      order.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.brokerOrderId &&
        order.brokerOrderId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const openOrders = filteredOrders.filter(
    (order) => order.status === "OPEN"
  ).length;
  const completedOrders = filteredOrders.filter(
    (order) => order.status === "COMPLETE"
  ).length;
  const cancelledOrders = filteredOrders.filter(
    (order) => order.status === "CANCELLED"
  ).length;
  const totalValue = filteredOrders.reduce(
    (sum, order) => sum + (order.price || 0) * order.quantity,
    0
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
      COMPLETE: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      },
      REJECTED: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      },
      PENDING: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: AlertCircle,
      },
      PLACED: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Target,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge
        className={`${config.color} border flex items-center gap-1 font-medium`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getSideBadge = (side: string) => {
    return (
      <Badge
        className={
          side === "BUY"
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200"
        }
      >
        {side}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
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
                {totalOrders}
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
                {completedOrders}
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
                {openOrders}
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
                ₹{(totalValue / 100000).toFixed(1)}L
              </div>
              <p className="text-xs text-gray-500">Order value</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full md:w-80 border-gray-300"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40 border-gray-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="COMPLETE">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PLACED">Placed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Export</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders found</p>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-700">
                        Order ID
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Symbol
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Type
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Side
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Quantity
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Price
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Created
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">
                              {order.id.slice(0, 8)}...
                            </span>
                            {order.brokerOrderId && (
                              <span className="text-xs text-gray-500">
                                Broker: {order.brokerOrderId.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {order.symbol}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.exchange}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-medium border-gray-300 text-gray-700"
                          >
                            {order.orderType}
                          </Badge>
                        </TableCell>
                        <TableCell>{getSideBadge(order.side)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-gray-900">
                              {order.quantity}
                            </span>
                            {order.filledQuantity !== undefined &&
                              order.filledQuantity !== null && (
                                <span className="text-xs text-gray-500">
                                  Filled: {order.filledQuantity}
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-700">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {order.price
                              ? `₹${order.price.toLocaleString()}`
                              : "Market"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              {order.status === "OPEN" && (
                                <DropdownMenuItem className="text-red-600">
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>Export Data</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
