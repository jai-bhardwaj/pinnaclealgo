"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, IndianRupee, Percent, RefreshCcw } from "lucide-react";
import { backendApi, type Strategy } from "@/lib/backend_api";

export function StrategyTable() {
  const { data: session } = useSession();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [editingMargin, setEditingMargin] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [squareOffLoading, setSquareOffLoading] = useState<string | null>(null);
  const [squareOffAllLoading, setSquareOffAllLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = async () => {
    try {
      const data = await backendApi.strategies.getAll();
      setStrategies(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError(err instanceof Error ? err.message : "Failed to load strategies");
    }
  };

  useEffect(() => {
    if (session?.user?.access_token) {
      fetchStrategies();
    }
  }, [session]);

  const formatMargin = (strategy: Strategy) => {
    const formattedValue = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(strategy.margin);

    if (strategy.marginType === "percentage") {
      return `${formattedValue}%`;
    } else {
      return `₹${formattedValue}`;
    }
  };

  const getMarginTooltip = (strategy: Strategy) => {
    const value = strategy.margin;
    if (strategy.marginType === "percentage") {
      const inRupees = (value * strategy.basePrice) / 100;
      return `₹${inRupees.toFixed(2)} (${value}% of ₹${strategy.basePrice})`;
    } else {
      const inPercentage = (value * 100) / strategy.basePrice;
      return `${inPercentage.toFixed(2)}% (₹${value} of ₹${strategy.basePrice})`;
    }
  };

  const handleMarginChange = async (
    id: string,
    value: string,
    type: "percentage" | "rupees"
  ) => {
    const numValue = parseFloat(value) || 0;
    try {
      const updatedStrategy = await backendApi.strategies.update(id, {
        margin: numValue,
        marginType: type,
      });
      
      setStrategies((prev) =>
        prev.map((strategy) =>
          strategy.id === id ? { ...updatedStrategy, lastUpdated: new Date().toLocaleDateString() } : strategy
        )
      );
      setError(null);
    } catch (err) {
      console.error("Error updating strategy:", err);
      setError("Failed to update strategy");
    }
  };

  const handleMarginBlur = () => {
    setEditingMargin(null);
  };

  const toggleMarginType = async (id: string) => {
    const strategy = strategies.find((s) => s.id === id);
    if (!strategy) return;

    const newType = strategy.marginType === "percentage" ? "rupees" : "percentage";
    const newMargin = strategy.marginType === "percentage"
      ? parseFloat(((strategy.margin * strategy.basePrice) / 100).toFixed(2))
      : parseFloat(((strategy.margin * 100) / strategy.basePrice).toFixed(2));

    try {
      const updatedStrategy = await backendApi.strategies.update(id, {
        margin: newMargin,
        marginType: newType,
      });
      
      setStrategies((prev) =>
        prev.map((strategy) =>
          strategy.id === id ? { ...updatedStrategy, lastUpdated: new Date().toLocaleDateString() } : strategy
        )
      );
      setError(null);
    } catch (err) {
      console.error("Error updating strategy:", err);
      setError("Failed to update strategy");
    }
  };

  const handleStatusChange = async (id: string) => {
    const strategy = strategies.find((s) => s.id === id);
    if (!strategy) return;

    const newStatus = strategy.status === "active" ? "inactive" : "active";

    try {
      const updatedStrategy = await backendApi.strategies.update(id, {
        status: newStatus,
      });
      
      setStrategies((prev) =>
        prev.map((strategy) =>
          strategy.id === id ? { ...updatedStrategy, lastUpdated: new Date().toLocaleDateString() } : strategy
        )
      );
      setError(null);
    } catch (err) {
      console.error("Error updating strategy:", err);
      setError("Failed to update strategy");
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchStrategies();
    setEditingMargin(null);
    setIsRefreshing(false);
  };

  const handleSquareOffStrategy = async (strategyId: string) => {
    setSquareOffLoading(strategyId);
    setMessage(null);
    try {
      const res = await backendApi.strategies.squareOff(strategyId);
      setMessage(res.message || "Square off completed");
      await fetchStrategies();
    } catch (err) {
      console.error("Error during square off:", err);
      setError("Failed to square off strategy");
    } finally {
      setSquareOffLoading(null);
    }
  };

  const handleSquareOffAll = async () => {
    setSquareOffAllLoading(true);
    setMessage(null);
    try {
      const res = await backendApi.strategies.squareOffAll();
      setMessage(res.message || "Square off all completed");
      await fetchStrategies();
    } catch (err) {
      console.error("Error during square off all:", err);
      setError("Failed to square off all strategies");
    } finally {
      setSquareOffAllLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-7">
              Total: {strategies.length}
            </Badge>
            <Badge variant="outline" className="h-7">
              Active: {strategies.filter((s) => s.status === "active").length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSquareOffAll}
              variant="destructive"
              className="gap-2"
              disabled={squareOffAllLoading}
            >
              {squareOffAllLoading ? "Squaring Off All..." : "Square Off All"}
            </Button>
            <Button
              onClick={handleRefreshData}
              variant="outline"
              className="gap-2"
              disabled={isRefreshing}
            >
              <RefreshCcw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
          </div>
        </div>
        {message && (
          <div className="my-2 text-center text-sm text-green-700 bg-green-100 rounded p-2">
            {message}
          </div>
        )}
        {error && (
          <div className="my-2 text-center text-sm text-red-700 bg-red-100 rounded p-2">
            {error}
          </div>
        )}
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[300px]">Strategy Name</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map((strategy) => (
                <TableRow key={strategy.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingMargin === strategy.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={strategy.margin}
                            onChange={(e) =>
                              handleMarginChange(
                                strategy.id,
                                e.target.value,
                                strategy.marginType
                              )
                            }
                            onBlur={handleMarginBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleMarginBlur();
                              if (e.key === "Escape") handleMarginBlur();
                            }}
                            autoFocus
                            className="w-24"
                          />
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => toggleMarginType(strategy.id)}
                              >
                                {strategy.marginType === "percentage" ? (
                                  <Percent className="w-3.5 h-3.5" />
                                ) : (
                                  <IndianRupee className="w-3.5 h-3.5" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Click to toggle between % and ₹
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="flex items-center gap-2 cursor-pointer group"
                              onDoubleClick={() =>
                                setEditingMargin(strategy.id)
                              }
                            >
                              <span className="px-2 py-1 rounded group-hover:bg-muted min-w-[80px] transition-colors">
                                {formatMargin(strategy)}
                              </span>
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-muted transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMarginType(strategy.id);
                                }}
                              >
                                {strategy.marginType === "percentage" ? (
                                  <Percent className="w-3.5 h-3.5" />
                                ) : (
                                  <IndianRupee className="w-3.5 h-3.5" />
                                )}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getMarginTooltip(strategy)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Double-click to edit
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {strategy.status === "active" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-all duration-200 transform hover:scale-105 select-none min-w-[90px] justify-center gap-1 py-1.5"
                              onClick={() => handleStatusChange(strategy.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer transition-all duration-200 transform hover:scale-105 select-none min-w-[90px] justify-center gap-1 py-1.5"
                              onClick={() => handleStatusChange(strategy.id)}
                            >
                              <X className="w-3.5 h-3.5" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Click to toggle status</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{strategy.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSquareOffStrategy(strategy.id)}
                      disabled={squareOffLoading === strategy.id}
                    >
                      {squareOffLoading === strategy.id ? "Squaring Off..." : "Square Off"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
