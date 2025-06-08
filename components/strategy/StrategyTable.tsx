"use client";

import { useState, useEffect } from "react";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Check, X, RefreshCcw } from "lucide-react";
import { backendApi, type Strategy } from "@/lib/backend_api";

export function StrategyTable() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [squareOffLoading, setSquareOffLoading] = useState<string | null>(null);
  const [squareOffAllLoading, setSquareOffAllLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = async () => {
    try {
      setIsRefreshing(true);
      const data = await backendApi.strategies.getAll();
      setStrategies(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError("Failed to load strategies");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

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
          strategy.id === id
            ? {
                ...updatedStrategy,
                lastUpdated: new Date().toLocaleDateString(),
              }
            : strategy
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
                    <Badge
                      variant={
                        strategy.status === "active" ? "default" : "secondary"
                      }
                      className={`cursor-pointer hover:opacity-80 ${
                        strategy.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : ""
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
                  <TableCell colSpan={4} className="text-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground">
                        No strategies found
                      </p>
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
                  <TableCell colSpan={4} className="text-center py-6">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      <span>Loading strategies...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-red-600">{error}</p>
                      <Button
                        onClick={handleRefreshData}
                        variant="outline"
                        size="sm"
                      >
                        Retry Connection
                      </Button>
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
