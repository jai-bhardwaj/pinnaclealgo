'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/contexts/user-context';
import type { DashboardStats } from '@/types';
import {
  TrendingUp,
  TrendingDown, Activity,
  BarChart3,
  Target,
  Zap,
  Shield,
  Clock,
  RefreshCw, Wallet,
  Calendar, PieChart
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalPnL: 0,
    activeStrategies: 0,
    openOrders: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch comprehensive dashboard data with real tRPC calls
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading } = trpc.portfolio.getUserBalance.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const { data: portfolioSummary, refetch: refetchSummary, isLoading: summaryLoading } = trpc.portfolio.getPortfolioSummary.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  // Fetch active strategies
  const { data: strategiesData, refetch: refetchStrategies, isLoading: strategiesLoading } = trpc.strategy.getByUserId.useQuery(
    { 
      userId: user?.id || '',
      pagination: { page: 1, limit: 100 },
      filters: { status: 'ACTIVE' as const }
    },
    { enabled: !!user?.id }
  );

  // Fetch open orders
  const { data: ordersData, refetch: refetchOrders, isLoading: ordersLoading } = trpc.order.getByUserId.useQuery(
    { 
      userId: user?.id || '',
      pagination: { page: 1, limit: 100 },
      filters: { status: 'OPEN' as const }
    },
    { enabled: !!user?.id }
  );

  // Fetch recent positions for portfolio value
  const { data: positionsData, refetch: refetchPositions } = trpc.portfolio.getPositionsByUserId.useQuery(
    { 
      userId: user?.id || '',
      pagination: { page: 1, limit: 10 },
      filters: {}
    },
    { enabled: !!user?.id }
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate real stats from fetched data
  useEffect(() => {
    if (balance || strategiesData || ordersData || portfolioSummary) {
      const activeStrategies = strategiesData?.data?.length || 0;
      const openOrders = ordersData?.data?.length || 0;
      const totalBalance = balance?.totalBalance || 0;
      const totalPnL = portfolioSummary?.balance?.totalPnl || balance?.totalPnl || 0;

      setStats({
        totalBalance,
        totalPnL,
        activeStrategies,
        openOrders,
      });
    }
  }, [balance, strategiesData, ordersData, portfolioSummary]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBalance(),
        refetchStrategies(),
        refetchOrders(),
        refetchSummary(),
        refetchPositions && refetchPositions()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const isLoading = balanceLoading || strategiesLoading || ordersLoading || summaryLoading;
  const totalPnLPercentage = stats.totalBalance > 0 ? (stats.totalPnL / stats.totalBalance) * 100 : 0;
  const isProfitable = stats.totalPnL >= 0;

  // Calculate additional metrics from real data
  const strategies = strategiesData?.data || [];
  const orders = ordersData?.data || [];
  const positions = positionsData?.data || [];
  
  const totalTrades = strategies.reduce((sum, strategy) => sum + strategy.totalTrades, 0);
  const avgWinRate = strategies.length > 0 ? 
    strategies.reduce((sum, strategy) => sum + strategy.winRate, 0) / strategies.length : 0;
  const portfolioValue = portfolioSummary?.balance?.portfolioValue || balance?.portfolioValue || 0;
  const availableCash = balance?.availableCash || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to view your trading dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Total Balance Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio</CardTitle>
              <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center">
                <Wallet className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `₹${stats.totalBalance.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">Available for trading</p>
              </div>
            </CardContent>
          </Card>

          {/* P&L Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total P&L</CardTitle>
              <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center">
                {isProfitable ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className={`text-2xl font-light ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${isProfitable ? '+' : '-'}₹${Math.abs(stats.totalPnL).toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">{totalPnLPercentage.toFixed(2)}% return</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Strategies Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Strategies</CardTitle>
              <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    stats.activeStrategies
                  )}
                </div>
                <p className="text-xs text-gray-500">Algorithms running</p>
              </div>
            </CardContent>
          </Card>

          {/* Open Orders Card */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open Orders</CardTitle>
              <div className="w-8 h-8 bg-gray-100 rounded-sm flex items-center justify-center">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    stats.openOrders
                  )}
                </div>
                <p className="text-xs text-gray-500">Pending execution</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Coming Soon Section */}
              <div className="text-center py-8">
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Coming Soon</h3>
                  <p className="text-gray-500 text-sm">
                    Quick action buttons will be available in the next update
                  </p>
                </div>
              </div>
              
              {/* Commented out current buttons for future use */}
              {/* 
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                Place New Order
              </Button>
              <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
              <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                <PieChart className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              */}
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="col-span-2 bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-white" />
                  </div>
                  <span>Performance Insights</span>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  Real-time
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      `${avgWinRate.toFixed(1)}%`
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Avg Win Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      totalTrades
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Total Trades</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      positions.length
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Active Positions</div>
                </div>
              </div>

              {/* Additional Real-time Metrics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Available Cash</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        `₹${availableCash.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <PieChart className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Portfolio Value</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {isLoading ? (
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                      ) : (
                        `₹${portfolioValue.toLocaleString()}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Last updated: {currentTime.toLocaleString()} • Real-time data
          </p>
        </div>
      </div>
    </div>
  );
} 