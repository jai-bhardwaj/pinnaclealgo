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
import { Check, X, IndianRupee, Percent, RefreshCcw, AlertCircle } from "lucide-react";
import { backendApi, type Strategy } from "@/lib/backend_api";

// Mock data in case the server is unreachable
const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "mock-1",
    name: "NIFTY Swing Strategy (Demo)",
    margin: 5,
    marginType: "percentage",
    basePrice: 24000,
    status: "inactive",
    lastUpdated: new Date().toLocaleDateString(),
    user_id: "mock-user"
  },
  {
    id: "mock-2",
    name: "Option Scalping Strategy (Demo)",
    margin: 2500,
    marginType: "rupees",
    basePrice: 50000,
    status: "inactive",
    lastUpdated: new Date().toLocaleDateString(),
    user_id: "mock-user"
  },
];

export function StrategyTable() {
  const { data: session } = useSession();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [editingMargin, setEditingMargin] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [squareOffLoading, setSquareOffLoading] = useState<string | null>(null);
  const [squareOffAllLoading, setSquareOffAllLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const fetchStrategies = async () => {
    try {
      setIsRefreshing(true);
      const data = await backendApi.strategies.getAll();
      setStrategies(data);
      setError(null);
      setUseMockData(false);
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError(err instanceof Error ? err.message : "Failed to load strategies");

      // After API fails, allow using mock data
      setUseMockData(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.access_token) {
      fetchStrategies();
    }
  }, [session]);

  const useMockDataNow = () => {
    setStrategies(MOCK_STRATEGIES);
    setError(null);
    setMessage("Using demo data. Backend connection is not available.");
    setUseMockData(false);
  };

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
                    {editingMargin === strategy.id ? (
                      <div className="inline-flex items-center space-x-1">
                        <Input
                          type="number"
                          defaultValue={strategy.margin.toString()}
                          className="w-20 h-8 text-sm"
                          autoFocus
                          onBlur={(e) => {
                            handleMarginChange(
                              strategy.id,
                              e.target.value,
                              strategy.marginType
                            );
                            handleMarginBlur();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.target as HTMLInputElement;
                              handleMarginChange(
                                strategy.id,
                                input.value,
                                strategy.marginType
                              );
                              handleMarginBlur();
                            }
                          }}
                        />
                        <button
                          onClick={() => toggleMarginType(strategy.id)}
                          className="text-muted-foreground"
                        >
                          {strategy.marginType === "percentage" ? (
                            <Percent className="h-4 w-4" />
                          ) : (
                            <IndianRupee className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="flex items-center space-x-1 hover:underline"
                            onClick={() => setEditingMargin(strategy.id)}
                          >
                            <span>{formatMargin(strategy)}</span>
                            <span className="text-muted-foreground">
                              {strategy.marginType === "percentage" ? (
                                <Percent className="h-3 w-3" />
                              ) : (
                                <IndianRupee className="h-3 w-3" />
                              )}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getMarginTooltip(strategy)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.status === "active" ? "default" : "secondary"
                      }
                      className={`cursor-pointer hover:opacity-80 ${strategy.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                        }`}
                      onClick={() => handleStatusChange(strategy.id)}
                    >
                      {strategy.status === "active" ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      {strategy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{strategy.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSquareOffStrategy(strategy.id)}
                      disabled={
                        squareOffLoading === strategy.id ||
                        strategy.status !== "active"
                      }
                    >
                      {squareOffLoading === strategy.id
                        ? "Processing..."
                        : "Square Off"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {strategies.length === 0 && !error && !isRefreshing && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground">No strategies found</p>
                      <Button
                        onClick={async () => {
                          setIsRefreshing(true);
                          try {
                            await backendApi.strategies.initialize();
                            await fetchStrategies();
                            setMessage("Default strategies initialized");
                          } catch (err) {
                            setError("Failed to initialize strategies");
                            console.error(err);
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Initialize Default Strategies
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isRefreshing && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      <span>Loading strategies...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-red-600">{error}</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRefreshData}
                          variant="outline"
                          size="sm"
                        >
                          Retry Connection
                        </Button>

                        {useMockData && (
                          <Button
                            onClick={useMockDataNow}
                            variant="default"
                            size="sm"
                            className="gap-1"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Use Demo Data
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
