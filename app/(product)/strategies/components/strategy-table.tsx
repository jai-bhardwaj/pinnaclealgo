"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Search,
  Download,
  RefreshCw,
  ArrowUpDown,
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
  Activity,
  Clock,
  Settings,
  Calendar,
  Copy,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  STRATEGY_STATUS_OPTIONS,
  ASSET_CLASS_OPTIONS,
  STRATEGY_TYPE_OPTIONS,
  StrategyWithCounts,
} from "../models/StrategyPageModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";

// Form schema for editing strategies
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

// Type guards for status and asset class
const isValidStatus = (
  status: string
): status is "ACTIVE" | "PAUSED" | "STOPPED" | "DRAFT" | "ERROR" => {
  return ["ACTIVE", "PAUSED", "STOPPED", "DRAFT", "ERROR"].includes(status);
};

const isValidAssetClass = (
  assetClass: string
): assetClass is
  | "EQUITY"
  | "DERIVATIVES"
  | "CRYPTO"
  | "COMMODITIES"
  | "FOREX" => {
  return ["EQUITY", "DERIVATIVES", "CRYPTO", "COMMODITIES", "FOREX"].includes(
    assetClass
  );
};

export interface StrategiesTableProps {
  strategies: StrategyWithCounts[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  assetClassFilter: string;
  onAssetClassFilterChange: (assetClass: string) => void;
  strategyTypeFilter: string;
  onStrategyTypeFilterChange: (strategyType: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onStartStrategy: (strategyId: string) => Promise<void>;
  onStopStrategy: (strategyId: string) => Promise<void>;
  onPauseStrategy: (strategyId: string) => Promise<void>;
  onEditStrategy: (strategy: StrategyWithCounts) => void;
  onDeleteStrategy: (strategyId: string) => void;
  highlightNewRows?: boolean;
}

export const StrategyTable = observer(
  ({
    strategies,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    assetClassFilter,
    onAssetClassFilterChange,
    strategyTypeFilter,
    onStrategyTypeFilterChange,
    onRefresh,
    onExport,
    onStartStrategy,
    onStopStrategy,
    onPauseStrategy,
    onEditStrategy,
    onDeleteStrategy,
    highlightNewRows = false,
  }: StrategiesTableProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] =
      useState<StrategyWithCounts | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingStrategy, setDeletingStrategy] =
      useState<StrategyWithCounts | null>(null);

    // Form handling for edit modal
    const form = useForm<EditStrategyFormData>({
      resolver: zodResolver(editStrategySchema),
    });

    const { handleSubmit, reset } = form;

    const onSubmit = async (data: EditStrategyFormData) => {
      if (!editingStrategy) return;

      try {
        // Check if capital allocation is being changed
        const isCapitalChanging =
          data.capitalRequired !== editingStrategy.capitalAllocated;

        if (isCapitalChanging) {
          // Show a confirmation dialog for capital allocation changes
          const confirmed = window.confirm(
            "Changing the capital allocation will temporarily deactivate and reactivate the strategy. This may cause a brief interruption in trading. Do you want to continue?"
          );

          if (!confirmed) {
            return; // User cancelled
          }
        }

        // Call the update strategy method from the parent component
        await onEditStrategy({
          ...editingStrategy,
          ...data,
          capitalAllocated: data.capitalRequired,
          updatedAt: new Date(),
        });

        setIsEditModalOpen(false);
        setEditingStrategy(null);
        reset();
      } catch (error) {
        console.error("Failed to update strategy:", error);
        // You could add a toast notification here for error feedback
      }
    };

    const handleDeleteConfirm = async () => {
      if (!deletingStrategy) return;

      try {
        await onDeleteStrategy(deletingStrategy.id);
        setIsDeleteModalOpen(false);
        setDeletingStrategy(null);
      } catch (error) {
        console.error("Failed to delete strategy:", error);
        // You could add a toast notification here for error feedback
      }
    };

    // Set form values when editing strategy changes
    React.useEffect(() => {
      if (editingStrategy) {
        const formData: EditStrategyFormData = {
          name: editingStrategy.name,
          description: editingStrategy.description || "",
          status: isValidStatus(editingStrategy.status)
            ? editingStrategy.status
            : "DRAFT",
          strategyType: editingStrategy.strategyType,
          assetClass: isValidAssetClass(editingStrategy.assetClass)
            ? editingStrategy.assetClass
            : "EQUITY",
          maxDrawdown: editingStrategy.maxDrawdown || 0,
          capitalRequired: editingStrategy.capitalAllocated || 0,
          targetReturn: 0, // Add default value
          riskLevel: "MEDIUM", // Add default value
        };
        reset(formData);
      }
    }, [editingStrategy, reset]);

    const getStatusBadge = (status: string, strategyId: string) => {
      const statusConfig = {
        ACTIVE: {
          color: "bg-green-100 text-green-800",
          hover: "hover:bg-green-200",
          icon: Play,
          action: "pause",
          tooltip: "Click to pause",
        },
        PAUSED: {
          color: "bg-yellow-100 text-yellow-800",
          hover: "hover:bg-yellow-200",
          icon: Pause,
          action: "start",
          tooltip: "Click to resume",
        },
        STOPPED: {
          color: "bg-red-100 text-red-800",
          hover: "hover:bg-red-200",
          icon: Square,
          action: "start",
          tooltip: "Click to start",
        },
        DRAFT: {
          color: "bg-gray-100 text-gray-800",
          hover: "hover:bg-gray-200",
          icon: Edit,
          action: "start",
          tooltip: "Click to activate",
        },
        ERROR: {
          color: "bg-red-100 text-red-800",
          hover: "hover:bg-red-200",
          icon: AlertCircle,
          action: "start",
          tooltip: "Click to restart",
        },
      };

      const config = statusConfig[status as keyof typeof statusConfig] || {
        color: "bg-gray-100 text-gray-800",
        hover: "hover:bg-gray-200",
        icon: Settings,
        action: "start",
        tooltip: "Click to start",
      };

      const Icon = config.icon;

      const handleStatusClick = async () => {
        if (actionLoading === strategyId) return; // Prevent multiple clicks

        setActionLoading(strategyId);

        try {
          await handleAction(config.action, strategyId);
        } catch (error) {
          console.error("Status toggle failed:", error);
          // You could add a toast notification here for error feedback
        } finally {
          setActionLoading(null);
        }
      };

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${config.color} ${
                config.hover
              } transition-all duration-200 transform hover:scale-105 select-none min-w-[90px] justify-center gap-1 py-1.5 cursor-pointer ${
                actionLoading === strategyId
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-md"
              }`}
              onClick={handleStatusClick}
            >
              {actionLoading === strategyId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {status}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount);
    };

    const handleAction = async (action: string, strategyId: string) => {
      try {
        switch (action) {
          case "start":
            await onStartStrategy(strategyId);
            break;
          case "pause":
            await onPauseStrategy(strategyId);
            break;
          case "stop":
            await onStopStrategy(strategyId);
            break;
          case "edit": {
            const strategy = strategies.find((s) => s.id === strategyId);
            if (strategy) {
              setEditingStrategy(strategy);
              setIsEditModalOpen(true);
            }
            break;
          }
          case "delete": {
            const strategy = strategies.find((s) => s.id === strategyId);
            if (strategy) {
              setDeletingStrategy(strategy);
              setIsDeleteModalOpen(true);
            }
            break;
          }
        }
      } catch (error) {
        console.error("Action failed:", error);
        throw error; // Re-throw so the calling function can handle it
      }
    };

    if (error) {
      return (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Strategies
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="border-red-300 text-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <TooltipProvider>
        <div className="space-y-4">
          {/* Header with search and filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search strategies..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Asset Class Filter */}
              <Select
                value={assetClassFilter}
                onValueChange={onAssetClassFilterChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Strategy Type Filter */}
              <Select
                value={strategyTypeFilter}
                onValueChange={onStrategyTypeFilterChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-7">
                Total: {strategies.length}
              </Badge>
              <Badge variant="outline" className="h-7">
                Active: {strategies.filter((s) => s.status === "ACTIVE").length}
              </Badge>
              <Badge variant="outline" className="h-7">
                Paused: {strategies.filter((s) => s.status === "PAUSED").length}
              </Badge>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Strategy Name</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PnL</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">
                          Loading strategies...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : strategies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No strategies found</p>
                        <Button onClick={onRefresh} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  strategies.map((strategy) => (
                    <TableRow
                      key={strategy.id}
                      className={`hover:bg-muted/50 ${
                        highlightNewRows ? "animate-pulse" : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{strategy.name}</div>
                          {strategy.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {strategy.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            strategy.assetClass === "EQUITY"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : strategy.assetClass === "DERIVATIVES"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : strategy.assetClass === "CRYPTO"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : strategy.assetClass === "COMMODITIES"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : strategy.assetClass === "FOREX"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {strategy.assetClass}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(strategy.status, strategy.id)}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-medium ${
                            strategy.totalPnl >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(strategy.totalPnl || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {strategy.totalTrades || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(strategy.winRate || 0).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatCurrency(strategy.capitalAllocated || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* The pause/start/stop buttons are now handled by getStatusBadge */}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction("edit", strategy.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction("delete", strategy.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                options={[10, 20, 50, 100]}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </div>

        {/* Edit Strategy Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Strategy</DialogTitle>
              <DialogDescription>
                Update the strategy configuration and parameters.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strategyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy Type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
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
                            <SelectItem value="ERROR">Error</SelectItem>
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
                            <SelectItem value="CRYPTO">Crypto</SelectItem>
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

                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxDrawdown"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Drawdown (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetReturn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Return (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capitalRequired"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital Required</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
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
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Strategy Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Strategy</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingStrategy?.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete Strategy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }
);
