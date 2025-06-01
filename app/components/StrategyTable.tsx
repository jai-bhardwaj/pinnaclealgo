"use client";

import { useState, useMemo } from "react";
import { observer } from 'mobx-react-lite';
import { useStrategyStore } from '@/stores';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MoreHorizontal,
    Play,
    Pause,
    Square,
    Search,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    BarChart3,
    Copy,
    Edit,
    Trash2,
    Download,
    RefreshCw,
} from "lucide-react";
import type { StrategyWithCounts } from '@/types';

interface StrategyTableProps {
  strategies: StrategyWithCounts[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

type SortField = 'name' | 'status' | 'totalPnl' | 'totalTrades' | 'winRate' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const StrategyTable = observer(({ strategies, isLoading, onRefresh }: StrategyTableProps) => {
  const strategyStore = useStrategyStore();
  
  // State management
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);

  // Filtered and sorted strategies
  const filteredStrategies = useMemo(() => {
    let filtered = strategies.filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          strategy.strategyType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || strategy.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort strategies
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [strategies, searchQuery, statusFilter, sortField, sortDirection]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = filteredStrategies.length;
    const active = filteredStrategies.filter(s => s.status === 'ACTIVE').length;
    const totalPnl = filteredStrategies.reduce((sum, s) => sum + s.totalPnl, 0);
    const totalTrades = filteredStrategies.reduce((sum, s) => sum + s.totalTrades, 0);
    
    return { total, active, totalPnl, totalTrades };
  }, [filteredStrategies]);

  // Event handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedStrategies(filteredStrategies.map(s => s.id));
    } else {
      setSelectedStrategies([]);
    }
  };

  const handleSelectStrategy = (strategyId: string, checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedStrategies([...selectedStrategies, strategyId]);
    } else {
      setSelectedStrategies(selectedStrategies.filter(id => id !== strategyId));
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'stop', strategyId: string) => {
    setActionLoading(strategyId);
    try {
      switch (action) {
        case 'start':
          await strategyStore.startStrategy(strategyId);
          break;
        case 'pause':
          await strategyStore.pauseStrategy(strategyId);
          break;
        case 'stop':
          await strategyStore.stopStrategy(strategyId);
          break;
      }
      onRefresh?.();
    } catch (error) {
      console.error(`Failed to ${action} strategy:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'start' | 'stop') => {
    setBulkActionLoading(action);
    try {
      // Implement bulk actions here
      if (action === 'stop') {
        await strategyStore.bulkStopStrategies(selectedStrategies);
      }
      setSelectedStrategies([]);
      onRefresh?.();
    } catch (error) {
      console.error(`Failed to ${action} strategies:`, error);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800 border-green-200', icon: Activity },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Pause },
      STOPPED: { color: 'bg-red-100 text-red-800 border-red-200', icon: Square },
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Edit },
      ERROR: { color: 'bg-red-100 text-red-800 border-red-200', icon: Activity },
      BACKTESTING: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: BarChart3 },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Loading strategies...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.active} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{summaryStats.totalPnl.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.totalPnl >= 0 ? (
                <span className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Profit
                </span>
              ) : (
                <span className="flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Loss
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              Across all strategies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStrategies.length > 0 
                ? Math.round(filteredStrategies.reduce((sum, s) => sum + s.winRate, 0) / filteredStrategies.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-80"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="STOPPED">Stopped</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedStrategies.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedStrategies.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('stop')}
                  disabled={bulkActionLoading === 'stop'}
                >
                  {bulkActionLoading === 'stop' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Stop All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredStrategies.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No strategies found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStrategies.length === filteredStrategies.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Strategy Name</span>
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead>Type & Asset</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('totalPnl')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>P&L</span>
                        {getSortIcon('totalPnl')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('totalTrades')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Performance</span>
                        {getSortIcon('totalTrades')}
                      </div>
                    </TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStrategies.map((strategy) => (
                    <TableRow 
                      key={strategy.id}
                      className={selectedStrategies.includes(strategy.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStrategies.includes(strategy.id)}
                          onCheckedChange={(checked) => handleSelectStrategy(strategy.id, checked)}
                          aria-label={`Select ${strategy.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{strategy.name}</div>
                          <div className="text-sm text-gray-500">{strategy.description || 'No description'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(strategy.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{strategy.strategyType}</div>
                          <div className="text-xs text-gray-500">{strategy.assetClass}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${strategy.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{strategy.totalPnl.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{strategy.totalTrades}</span> trades
                          </div>
                          <div className="text-xs text-gray-500">
                            {strategy.winRate.toFixed(1)}% win rate
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{strategy._count?.orders || 0}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {strategy.status !== 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => handleAction('start', strategy.id)}
                                disabled={actionLoading === strategy.id}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Start Strategy
                              </DropdownMenuItem>
                            )}
                            
                            {strategy.status === 'ACTIVE' && (
                              <DropdownMenuItem
                                onClick={() => handleAction('pause', strategy.id)}
                                disabled={actionLoading === strategy.id}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Strategy
                              </DropdownMenuItem>
                            )}
                            
                            {(strategy.status === 'ACTIVE' || strategy.status === 'PAUSED') && (
                              <DropdownMenuItem
                                onClick={() => handleAction('stop', strategy.id)}
                                disabled={actionLoading === strategy.id}
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop Strategy
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Settings
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Strategy
                            </DropdownMenuItem>
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
  );
});

export default StrategyTable;
