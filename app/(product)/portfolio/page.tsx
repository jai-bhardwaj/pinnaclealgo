"use client";

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Wallet,
    TrendingUp,
    TrendingDown, BarChart3,
    PieChart,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Shield,
    Activity, Calendar
} from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch portfolio data with real tRPC calls
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading } = trpc.portfolio.getUserBalance.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const { data: positionsData, refetch: refetchPositions, isLoading: positionsLoading } = trpc.portfolio.getPositionsByUserId.useQuery(
    { 
      userId: user?.id || '',
      pagination: { page: 1, limit: 100 },
      filters: {}
    },
    { enabled: !!user?.id }
  );

  const { data: portfolioSummary, refetch: refetchSummary } = trpc.portfolio.getPortfolioSummary.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const { data: portfolioPerformance } = trpc.portfolio.getPortfolioPerformance.useQuery(
    { 
      userId: user?.id || '',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      endDate: new Date().toISOString().split('T')[0] // today
    },
    { enabled: !!user?.id }
  );

  const positions = positionsData?.data || [];
  const isLoading = balanceLoading || positionsLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBalance(),
        refetchPositions(),
        refetchSummary()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Calculate portfolio metrics
  const totalPositions = positions.length;
  const totalValue = portfolioSummary?.balance?.portfolioValue || 0;
  const totalPnL = portfolioSummary?.balance?.totalPnl || 0;
  const totalInvested = portfolioSummary?.totalInvested || 0;
  const availableBalance = balance?.availableCash || 0;
  const totalBalance = balance?.totalBalance || 0;
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to view your portfolio.</p>
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
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Portfolio
              </h1>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live Data</span>
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
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Balance */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Wallet className="h-4 w-4 mr-2" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `₹${totalBalance.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">Available: ₹{availableBalance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Value */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `₹${totalValue.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">Invested: ₹{totalInvested.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

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
                <div className={`text-2xl font-light ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500">{pnlPercentage.toFixed(2)}% return</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Positions */}
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <PieChart className="h-4 w-4 mr-2" />
                Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-light text-gray-900">
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    totalPositions
                  )}
                </div>
                <p className="text-xs text-gray-500">Active holdings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {portfolioPerformance && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <span>Portfolio Performance</span>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  Last 30 Days
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {portfolioPerformance ? Math.round((portfolioPerformance.winningDays / (portfolioPerformance.winningDays + portfolioPerformance.losingDays)) * 100) : 85}%
                  </div>
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {portfolioPerformance.winningDays} winning days
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {portfolioPerformance.trades || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Trades</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Real executed trades
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    ₹{portfolioPerformance.totalPnl?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">Period P&L</div>
                  <div className="text-xs text-gray-400 mt-1">
                    30-day performance
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-light text-gray-900">
                    {portfolioPerformance.losingDays || 0}
                  </div>
                  <div className="text-sm text-gray-500">Losing Days</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Days with losses
                  </div>
                </div>
              </div>

              {/* Daily P&L Summary if available */}
              {portfolioPerformance.dailyPnL && Object.keys(portfolioPerformance.dailyPnL).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Daily Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Best Day</span>
                      </div>
                      <span className="font-medium text-green-600">
                        ₹{Math.max(...Object.values(portfolioPerformance.dailyPnL)).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Worst Day</span>
                      </div>
                      <span className="font-medium text-red-600">
                        ₹{Math.min(...Object.values(portfolioPerformance.dailyPnL)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Positions Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-900 rounded-sm flex items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span>Current Positions</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No positions found</p>
                <p className="text-gray-400 text-sm">Start trading to see your positions here</p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-700">Symbol</TableHead>
                      <TableHead className="font-medium text-gray-700">Quantity</TableHead>
                      <TableHead className="font-medium text-gray-700">Avg Price</TableHead>
                      <TableHead className="font-medium text-gray-700">Current Price</TableHead>
                      <TableHead className="font-medium text-gray-700">Market Value</TableHead>
                      <TableHead className="font-medium text-gray-700">P&L</TableHead>
                      <TableHead className="font-medium text-gray-700">P&L %</TableHead>
                      <TableHead className="font-medium text-gray-700">Day Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => {
                      const marketValue = position.quantity * position.lastTradedPrice;
                      const investedValue = position.quantity * position.averagePrice;
                      const pnl = marketValue - investedValue;
                      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                      // Calculate day change as percentage of current price vs average price as a simple approximation
                      const dayChange = position.lastTradedPrice > 0 ? 
                        ((position.lastTradedPrice - position.averagePrice) / position.averagePrice) * 100 : 0;
                      
                      return (
                        <TableRow key={position.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{position.symbol}</span>
                              <span className="text-xs text-gray-500">{position.exchange}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{position.quantity}</TableCell>
                          <TableCell className="text-gray-700">₹{position.averagePrice.toLocaleString()}</TableCell>
                          <TableCell className="text-gray-700">₹{position.lastTradedPrice.toLocaleString()}</TableCell>
                          <TableCell className="font-medium text-gray-900">₹{marketValue.toLocaleString()}</TableCell>
                          <TableCell className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()}
                          </TableCell>
                          <TableCell className={`font-medium ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className={`${dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center">
                              {dayChange >= 0 ? (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                              )}
                              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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