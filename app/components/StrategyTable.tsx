"use client";

import React, { memo, useMemo, useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Target,
  BarChart3,
  RefreshCw,
  Activity,
  Download,
  Clock,
  Settings,
  Calendar,
  Copy,
  Zap,
} from "lucide-react";
import { type StrategyWithCounts } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Memoized Badge Component for Asset Classes
const AssetBadge = memo(
  ({ asset, strategyType }: { asset: string; strategyType: string }) => {
    const getBadgeColor = useCallback((assetType: string) => {
      const colors: Record<string, string> = {
        EQUITY: "bg-blue-100 text-blue-800 border-blue-200",
        DERIVATIVES: "bg-purple-100 text-purple-800 border-purple-200",
        CRYPTO: "bg-orange-100 text-orange-800 border-orange-200",
        COMMODITIES: "bg-green-100 text-green-800 border-green-200",
        FOREX: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
      return colors[assetType] || "bg-gray-100 text-gray-800 border-gray-200";
    }, []);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={cn("border", getBadgeColor(asset))}>
              {asset}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Strategy Type: {strategyType}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

AssetBadge.displayName = "AssetBadge";

// Form schema for editing strategies - Fixed status enum
const editStrategySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "STOPPED", "DRAFT", "ERROR"]),
  strategyType: z.string().min(1, "Strategy type is required"),
  assetClass: z.enum([
    "EQUITY",
    "DERIVATIVES",
    "CRYPTO",
    "COMMODITIES",
    "FOREX",
  ]),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  maxDrawdown: z.number().min(0).max(100),
  targetReturn: z.number().min(0),
  capitalRequired: z.number().min(0),
});

type EditStrategyFormData = z.infer<typeof editStrategySchema>;

// Memoized Status Badge Component
const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
      case "STOPPED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  return (
    <Badge className={cn("border", getStatusColor(status))}>{status}</Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

// Helper functions
const getStatusBadge = (status: string) => <StatusBadge status={status} />;
const getAssetBadge = (asset: string, strategyType: string) => (
  <AssetBadge asset={asset} strategyType={strategyType} />
);

interface StrategyTableProps {
  strategies: StrategyWithCounts[];
  isLoading: boolean;
  onRefresh: () => void;
}

const StrategyTableComponent: React.FC<StrategyTableProps> = ({
  strategies,
  isLoading,
  onRefresh,
}) => {
  const { strategyStore } = useStores();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof StrategyWithCounts>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] =
    useState<StrategyWithCounts | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Memoized filtered and sorted strategies
  const filteredStrategies = useMemo(() => {
    const filtered = strategies.filter((strategy) => {
      const matchesSearch =
        strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.strategyType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || strategy.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [strategies, searchQuery, statusFilter, sortField, sortDirection]);

  // Memoized summary stats - Fixed property names
  const summaryStats = useMemo(() => {
    const total = strategies.length;
    const active = strategies.filter((s) => s.status === "ACTIVE").length;
    const totalPnL = strategies.reduce((sum, s) => sum + (s.totalPnl || 0), 0);
    const totalTrades = strategies.reduce(
      (sum, s) => sum + (s.totalTrades || 0),
      0
    );

    return { total, active, totalPnL, totalTrades };
  }, [strategies]);

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedStrategies(filteredStrategies.map((s) => s.id));
      } else {
        setSelectedStrategies([]);
      }
    },
    [filteredStrategies]
  );

  const handleSelectStrategy = useCallback(
    (strategyId: string, checked: boolean) => {
      if (checked) {
        setSelectedStrategies((prev) => [...prev, strategyId]);
      } else {
        setSelectedStrategies((prev) => prev.filter((id) => id !== strategyId));
      }
    },
    []
  );

  // Edit strategy handler
  const handleEditStrategy = useCallback((strategy: StrategyWithCounts) => {
    setEditingStrategy(strategy);
    setIsEditModalOpen(true);
  }, []);

  // Memoized action handler
  const handleAction = useCallback(
    async (action: string, strategyId: string) => {
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
          case "edit":
            const strategy = strategies.find((s) => s.id === strategyId);
            if (strategy) {
              setEditingStrategy(strategy);
              setIsEditModalOpen(true);
            }
            break;
          case "delete":
            // TODO: Implement delete functionality
            console.log("Delete strategy:", strategyId);
            break;
        }
        onRefresh();
      } catch (error) {
        console.error("Action failed:", error);
      } finally {
        setActionLoading(null);
      }
    },
    [strategyStore, strategies, onRefresh]
  );

  // Memoized sort handler
  const handleSort = useCallback(
    (field: keyof StrategyWithCounts) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  // Form handling for edit modal
  const form = useForm<EditStrategyFormData>({
    resolver: zodResolver(editStrategySchema),
  });

  const { handleSubmit, reset } = form;

  const onSubmit = useCallback(
    async (data: EditStrategyFormData) => {
      if (!editingStrategy) return;

      try {
        await strategyStore.updateStrategy(editingStrategy.id, data);
        setIsEditModalOpen(false);
        setEditingStrategy(null);
        reset();
        onRefresh();
      } catch (error) {
        console.error("Failed to update strategy:", error);
      }
    },
    [editingStrategy, strategyStore, reset, onRefresh]
  );

  // Set form values when editing strategy changes
  React.useEffect(() => {
    if (editingStrategy) {
      reset({
        name: editingStrategy.name,
        description: editingStrategy.description || "",
        status: editingStrategy.status as any,
        strategyType: editingStrategy.strategyType,
        assetClass: editingStrategy.assetClass as any,
        maxDrawdown: editingStrategy.maxDrawdown || 0,
        capitalRequired: editingStrategy.capitalAllocated || 0,
        targetReturn: 0, // Add default value
        riskLevel: "MEDIUM" as any, // Add default value
      });
    }
  }, [editingStrategy, reset]);

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
                summaryStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{(summaryStats.totalPnL / 100000).toFixed(1)}L
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
              {summaryStats.totalTrades > 0
                ? (
                    (summaryStats.totalTrades / summaryStats.totalTrades) *
                    100
                  ).toFixed(1)
                : "N/A"}
              %
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
                            filteredStrategies.length > 0 &&
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
                      <TableRow key={strategy.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedStrategies.includes(strategy.id)}
                            onCheckedChange={(checked) =>
                              handleSelectStrategy(strategy.id, !!checked)
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
                                          {formatDate(strategy.updatedAt)}
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
                                        onClick={() =>
                                          handleAction("start", strategy.id)
                                        }
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
                                        onClick={() =>
                                          handleAction("pause", strategy.id)
                                        }
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
                        <TableCell>{getStatusBadge(strategy.status)}</TableCell>
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
                              {formatDate(strategy.updatedAt)}
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
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      Provide a detailed description of your strategy's approach
                      and goals.
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
                          <SelectItem value="DERIVATIVES">
                            Derivatives
                          </SelectItem>
                          <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                          <SelectItem value="COMMODITIES">
                            Commodities
                          </SelectItem>
                          <SelectItem value="FOREX">Forex</SelectItem>
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
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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
};

export const StrategyTable = memo(observer(StrategyTableComponent));

StrategyTable.displayName = "StrategyTable";

export default StrategyTable;
