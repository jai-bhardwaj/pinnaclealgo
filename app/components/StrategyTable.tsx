"use client";

import { useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useStrategyStore } from "@/stores";
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
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Search,
  Filter,
  Activity,
  IndianRupee,
  BarChart3,
  Copy,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Settings,
} from "lucide-react";
import type { StrategyWithCounts } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface StrategyTableProps {
  strategies: StrategyWithCounts[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

type SortField =
  | "name"
  | "status"
  | "totalPnl"
  | "totalTrades"
  | "winRate"
  | "updatedAt";
type SortDirection = "asc" | "desc";

const editStrategySchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional(),
  strategyType: z.string().min(1, "Strategy type is required"),
  assetClass: z.string().min(1, "Asset class is required"),
  status: z.enum([
    "ACTIVE",
    "PAUSED",
    "STOPPED",
    "DRAFT",
    "ERROR",
    "BACKTESTING",
  ]),
});

type EditStrategyFormData = z.infer<typeof editStrategySchema>;

const StrategyTable = observer(
  ({ strategies, isLoading, onRefresh }: StrategyTableProps) => {
    const strategyStore = useStrategyStore();

    // State management
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>("updatedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(
      null
    );
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] =
      useState<StrategyWithCounts | null>(null);

    // Form setup
    const form = useForm<EditStrategyFormData>({
      resolver: zodResolver(editStrategySchema),
      defaultValues: {
        name: "",
        description: "",
        strategyType: "",
        assetClass: "",
        status: "DRAFT",
      },
    });

    // Filtered and sorted strategies
    const filteredStrategies = useMemo(() => {
      let filtered = strategies.filter((strategy) => {
        const matchesSearch =
          strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          strategy.strategyType
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || strategy.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      // Sort strategies
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === "updatedAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === "asc") {
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
      const active = filteredStrategies.filter(
        (s) => s.status === "ACTIVE"
      ).length;
      const paused = filteredStrategies.filter(
        (s) => s.status === "PAUSED"
      ).length;
      const totalPnl = filteredStrategies.reduce(
        (sum, s) => sum + s.totalPnl,
        0
      );
      const totalTrades = filteredStrategies.reduce(
        (sum, s) => sum + s.totalTrades,
        0
      );
      const avgWinRate =
        filteredStrategies.length > 0
          ? filteredStrategies.reduce((sum, s) => sum + s.winRate, 0) /
            filteredStrategies.length
          : 0;

      return { total, active, paused, totalPnl, totalTrades, avgWinRate };
    }, [filteredStrategies]);

    // Event handlers
    const handleSelectAll = (checked: boolean | string) => {
      const isChecked = checked === true;
      if (isChecked) {
        setSelectedStrategies(filteredStrategies.map((s) => s.id));
      } else {
        setSelectedStrategies([]);
      }
    };

    const handleSelectStrategy = (
      strategyId: string,
      checked: boolean | string
    ) => {
      const isChecked = checked === true;
      if (isChecked) {
        setSelectedStrategies([...selectedStrategies, strategyId]);
      } else {
        setSelectedStrategies(
          selectedStrategies.filter((id) => id !== strategyId)
        );
      }
    };

    const handleAction = async (
      action: "start" | "pause" | "stop",
      strategyId: string
    ) => {
      setActionLoading(strategyId);
      try {
        switch (action) {
          case "start":
            await strategyStore.startStrategy(strategyId);
            break;
          case "pause":
            await strategyStore.pauseStrategy(strategyId);
            break;
          case "stop":
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

    const handleBulkAction = async (action: "start" | "stop") => {
      setBulkActionLoading(action);
      try {
        // Implement bulk actions here
        if (action === "stop") {
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

    const handleEditStrategy = (strategy: StrategyWithCounts) => {
      setEditingStrategy(strategy);
      form.reset({
        name: strategy.name,
        description: strategy.description || "",
        strategyType: strategy.strategyType,
        assetClass: strategy.assetClass,
        status: strategy.status as any,
      });
      setEditModalOpen(true);
    };

    const onSubmitEdit = async (data: EditStrategyFormData) => {
      if (!editingStrategy) return;

      try {
        // Here you would call your API to update the strategy
        // await strategyStore.updateStrategy(editingStrategy.id, data);
        console.log("Updating strategy:", editingStrategy.id, data);

        setEditModalOpen(false);
        setEditingStrategy(null);
        onRefresh?.();
      } catch (error) {
        console.error("Failed to update strategy:", error);
      }
    };

    const getStatusBadge = (status: string) => {
      const statusConfig = {
        ACTIVE: {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        },
        PAUSED: {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Pause,
        },
        STOPPED: {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: Square,
        },
        DRAFT: {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Edit,
        },
        ERROR: {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: Activity,
        },
        BACKTESTING: {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: BarChart3,
        },
      };

      const config =
        statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
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

    const getAssetBadge = (assetClass: string, strategyType: string) => {
      const assetConfig = {
        EQUITY: {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Equity",
        },
        FUTURES: {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          label: "Futures",
        },
        OPTIONS: {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          label: "Options",
        },
        CURRENCY: {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Currency",
        },
        COMMODITIES: {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "Commodities",
        },
        CRYPTO: {
          color: "bg-indigo-100 text-indigo-800 border-indigo-200",
          label: "Crypto",
        },
      };

      const config = assetConfig[assetClass as keyof typeof assetConfig] || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: assetClass,
      };

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={`${config.color} border font-medium cursor-help hover:shadow-sm transition-shadow`}
            >
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Strategy Type: {strategyType}</p>
          </TooltipContent>
        </Tooltip>
      );
    };

    if (isLoading) {
      return (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading strategies...</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
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
                {summaryStats.total}
              </div>
              <p className="text-xs text-gray-500">
                {summaryStats.active} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <IndianRupee className="h-4 w-4 mr-2" />
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-light ${
                  summaryStats.totalPnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₹{(summaryStats.totalPnl / 100000).toFixed(1)}L
              </div>
              <p className="text-xs text-gray-500">Combined profit/loss</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-gray-900">
                {summaryStats.totalTrades}
              </div>
              <p className="text-xs text-gray-500">Across all strategies</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Avg Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-gray-900">
                {summaryStats.avgWinRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">Success rate</p>
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
                    placeholder="Search strategies..."
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
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="STOPPED">Stopped</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {selectedStrategies.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedStrategies.length} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction("stop")}
                      disabled={bulkActionLoading === "stop"}
                    >
                      {bulkActionLoading === "stop" && (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Stop All
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredStrategies.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No strategies found</p>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedStrategies.length ===
                              filteredStrategies.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="font-medium text-gray-700 w-64">
                          Strategy Name
                        </TableHead>
                        <TableHead className="font-medium text-gray-700">
                          Status
                        </TableHead>
                        <TableHead className="font-medium text-gray-700">
                          Asset Class
                        </TableHead>
                        <TableHead className="font-medium text-gray-700">
                          P&L
                        </TableHead>
                        <TableHead className="font-medium text-gray-700">
                          Performance
                        </TableHead>
                        <TableHead className="font-medium text-gray-700">
                          Updated
                        </TableHead>
                        <TableHead className="font-medium text-gray-700 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStrategies.map((strategy) => (
                        <TableRow
                          key={strategy.id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedStrategies.includes(strategy.id)}
                              onCheckedChange={(checked) =>
                                handleSelectStrategy(strategy.id, checked)
                              }
                              aria-label={`Select ${strategy.name}`}
                            />
                          </TableCell>
                          <TableCell className="max-w-64">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="cursor-pointer">
                                  <div className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                                    {strategy.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {strategy.description || "No description"}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent
                                side="right"
                                className="w-96 p-0 border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50"
                              >
                                <Card className="border-0 shadow-none bg-transparent">
                                  <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                                          {strategy.name}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                          {strategy.description ||
                                            "Advanced trading strategy"}
                                        </p>
                                      </div>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="space-y-4">
                                    {/* Status and Type */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                          Status
                                        </p>
                                        <div className="flex items-center space-x-2">
                                          {getStatusBadge(strategy.status)}
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                          Type
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                          {strategy.strategyType}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {strategy.assetClass}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-white/70 rounded-lg p-3 text-center">
                                        <div
                                          className={`text-lg font-bold ${
                                            strategy.totalPnl >= 0
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {strategy.totalPnl >= 0 ? "+" : ""}₹
                                          {strategy.totalPnl.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-gray-600 flex items-center justify-center mt-1">
                                          {strategy.totalPnl >= 0 ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                          )}
                                          Total P&L
                                        </p>
                                      </div>
                                      <div className="bg-white/70 rounded-lg p-3 text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {strategy.winRate.toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-gray-600 flex items-center justify-center mt-1">
                                          <Target className="h-3 w-3 mr-1" />
                                          Win Rate
                                        </p>
                                      </div>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                      <div className="bg-white/50 rounded p-2">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {strategy.totalTrades}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Trades
                                        </div>
                                      </div>
                                      <div className="bg-white/50 rounded p-2">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {strategy._count?.orders || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Orders
                                        </div>
                                      </div>
                                      <div className="bg-white/50 rounded p-2">
                                        <div className="text-sm font-semibold text-gray-900 flex items-center justify-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>
                                            {new Date(
                                              strategy.updatedAt
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Updated
                                        </div>
                                      </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex space-x-2 pt-2">
                                      {strategy.status !== "ACTIVE" && (
                                        <Button
                                          size="sm"
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                          <Play className="h-3 w-3 mr-1" />
                                          Start
                                        </Button>
                                      )}
                                      {strategy.status === "ACTIVE" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1"
                                        >
                                          <Pause className="h-3 w-3 mr-1" />
                                          Pause
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() =>
                                          handleEditStrategy(strategy)
                                        }
                                      >
                                        <Settings className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(strategy.status)}
                          </TableCell>
                          <TableCell>
                            {getAssetBadge(
                              strategy.assetClass,
                              strategy.strategyType
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-gray-700">
                              <IndianRupee className="h-3 w-3 mr-1" />
                              <span
                                className={`font-medium ${
                                  strategy.totalPnl >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {strategy.totalPnl.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-gray-900">
                                {strategy.totalTrades} trades
                              </span>
                              <span className="text-xs text-gray-500">
                                {strategy.winRate.toFixed(1)}% win rate
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {new Date(
                                  strategy.updatedAt
                                ).toLocaleDateString()}
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

                                {strategy.status !== "ACTIVE" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction("start", strategy.id)
                                    }
                                    disabled={actionLoading === strategy.id}
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Strategy
                                  </DropdownMenuItem>
                                )}

                                {strategy.status === "ACTIVE" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction("pause", strategy.id)
                                    }
                                    disabled={actionLoading === strategy.id}
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause Strategy
                                  </DropdownMenuItem>
                                )}

                                {(strategy.status === "ACTIVE" ||
                                  strategy.status === "PAUSED") && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction("stop", strategy.id)
                                    }
                                    disabled={actionLoading === strategy.id}
                                  >
                                    <Square className="mr-2 h-4 w-4" />
                                    Stop Strategy
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleEditStrategy(strategy)}
                                >
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Strategy Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Edit Strategy</span>
              </DialogTitle>
              <DialogDescription>
                Update your strategy configuration and settings.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitEdit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter strategy name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                            <SelectItem value="STOPPED">Stopped</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="BACKTESTING">
                              Backtesting
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your strategy..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of your strategy's
                        approach and goals.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="strategyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MOMENTUM">Momentum</SelectItem>
                            <SelectItem value="MEAN_REVERSION">
                              Mean Reversion
                            </SelectItem>
                            <SelectItem value="ARBITRAGE">Arbitrage</SelectItem>
                            <SelectItem value="SCALPING">Scalping</SelectItem>
                            <SelectItem value="SWING">Swing Trading</SelectItem>
                            <SelectItem value="AI_ML">AI/ML Based</SelectItem>
                            <SelectItem value="CUSTOM">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assetClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Class</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EQUITY">Equity</SelectItem>
                            <SelectItem value="FUTURES">Futures</SelectItem>
                            <SelectItem value="OPTIONS">Options</SelectItem>
                            <SelectItem value="CURRENCY">Currency</SelectItem>
                            <SelectItem value="COMMODITIES">
                              Commodities
                            </SelectItem>
                            <SelectItem value="CRYPTO">
                              Cryptocurrency
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Update Strategy
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default StrategyTable;
