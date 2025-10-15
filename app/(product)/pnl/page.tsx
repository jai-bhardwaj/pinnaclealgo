"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Calendar,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTrades, usePositions, useOrders } from "@/hooks/useTradingApi";

export default function PnLPage() {
  const { user } = useUser();
  const [dateRange, setDateRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  // Initialize current date on client side only to prevent hydration mismatch
  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  // Fetch data using new hooks
  const {
    data: trades,
    isLoading: tradesLoading,
    refetch: refetchTrades,
  } = useTrades(user?.id || "");
  const {
    data: positions,
    isLoading: positionsLoading,
    refetch: refetchPositions,
  } = usePositions(user?.id || "");
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useOrders(user?.id || "", {
    limit: 100,
    offset: 0,
  });

  const isLoading = tradesLoading || positionsLoading || ordersLoading;
  const completedOrders = ordersData?.data || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchTrades(), refetchPositions(), refetchOrders()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Calculate P&L metrics from positions and trades
  const totalPnL = positions?.reduce((sum, pos) => sum + pos.pnl, 0) || 0;
  const realizedPnL =
    trades?.reduce((sum, trade) => sum + trade.net_amount, 0) || 0;
  const unrealizedPnL = totalPnL - realizedPnL;
  const totalInvested =
    positions?.reduce(
      (sum, pos) => sum + pos.quantity * pos.average_price,
      0
    ) || 0;
  const pnlPercentage =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Calculate strategy performance
  const totalTrades = trades?.length || 0;
  const profitableTrades =
    trades?.filter((trade) => trade.net_amount > 0).length || 0;
  const avgWinRate =
    totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  // Generate daily P&L data from trades
  const generateDailyPnL = () => {
    const days = parseInt(dateRange.replace("d", ""));
    const data: Array<{
      date: string;
      dailyPnL: number;
      cumulativePnL: number;
      trades: number;
    }> = [];

    if (trades && trades.length > 0) {
      // Group trades by date
      const tradesByDate = trades.reduce((acc, trade) => {
        const date = new Date(trade.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(trade);
        return acc;
      }, {} as Record<string, typeof trades>);

      // Calculate daily P&L
      let cumulativePnL = 0;
      const sortedDates = Object.keys(tradesByDate).sort();

      sortedDates.slice(-days).forEach((date) => {
        const dayTrades = tradesByDate[date];
        const dailyPnL = dayTrades.reduce(
          (sum, trade) => sum + trade.net_amount,
          0
        );
        cumulativePnL += dailyPnL;

        data.push({
          date,
          dailyPnL,
          cumulativePnL,
          trades: dayTrades.length,
        });
      });
    }

    return data;
  };

  const dailyPnLData = generateDailyPnL();

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
                Profit & Loss
              </h1>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{currentDate || "Loading..."}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time Data</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="365d">1 Year</SelectItem>
              </SelectContent>
            </Select>

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

            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* P&L Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total P&L */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-2" />
                )}
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div
                  className={`text-2xl font-light ${
                    totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${totalPnL >= 0 ? "+" : ""}₹${Math.abs(
                      totalPnL
                    ).toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {pnlPercentage.toFixed(2)}% return
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Realized P&L */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Realized P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div
                  className={`text-2xl font-light ${
                    realizedPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `₹${realizedPnL.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">Closed positions</p>
              </div>
            </CardContent>
          </Card>

          {/* Unrealized P&L */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Unrealized P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div
                  className={`text-2xl font-light ${
                    unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `₹${unrealizedPnL.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">Open positions</p>
              </div>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${avgWinRate.toFixed(1)}%`
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {totalTrades} total trades
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                  <Target className="h-3 w-3 text-white" />
                </div>
                <span>Performance Analytics</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-700 border-gray-200"
              >
                Last {dateRange}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-light text-gray-900">
                  {profitableTrades}
                </div>
                <div className="text-sm text-gray-500">Profitable Trades</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-light text-gray-900">2.4x</div>
                <div className="text-sm text-gray-500">Sharpe Ratio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-light text-gray-900">15%</div>
                <div className="text-sm text-gray-500">Max Drawdown</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-light text-gray-900">
                  {completedOrders.length}
                </div>
                <div className="text-sm text-gray-500">Executed Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily P&L Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                <BarChart3 className="h-3 w-3 text-white" />
              </div>
              <span>Daily P&L History</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading P&L data...</p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-700">
                        Date
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Daily P&L
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Cumulative P&L
                      </TableHead>
                      <TableHead className="font-medium text-gray-700">
                        Trades
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 text-right">
                        Performance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPnLData.slice(-10).map((day, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-700">
                              {formatDate(day.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            day.dailyPnL >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            {day.dailyPnL >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>
                              {day.dailyPnL >= 0 ? "+" : ""}₹
                              {day.dailyPnL.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            day.cumulativePnL >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ₹{day.cumulativePnL.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-medium border-gray-300 text-gray-700"
                          >
                            {day.trades}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            {day.dailyPnL >= 0 ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                                Profit
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-red-200 border">
                                Loss
                              </Badge>
                            )}
                          </div>
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
