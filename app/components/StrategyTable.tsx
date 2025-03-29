"use client";

import { useState } from "react";
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
import { Strategy, generateRandomStrategies } from "@/app/constants/strategies";
import { Check, X, IndianRupee, Percent, RefreshCcw } from "lucide-react";

export function StrategyTable() {
  const [strategies, setStrategies] = useState<Strategy[]>(() =>
    generateRandomStrategies(8)
  );
  const [editingMargin, setEditingMargin] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      return `${inPercentage.toFixed(2)}% (₹${value} of ₹${
        strategy.basePrice
      })`;
    }
  };

  const handleMarginChange = (
    id: string,
    value: string,
    type: "percentage" | "rupees"
  ) => {
    const numValue = parseFloat(value) || 0;
    setStrategies((prev) =>
      prev.map((strategy) =>
        strategy.id === id
          ? {
              ...strategy,
              margin: numValue,
              marginType: type,
              lastUpdated: new Date().toLocaleDateString(),
            }
          : strategy
      )
    );
  };

  const handleMarginBlur = () => {
    setEditingMargin(null);
  };

  const toggleMarginType = (id: string) => {
    setStrategies((prev) =>
      prev.map((strategy) =>
        strategy.id === id
          ? {
              ...strategy,
              marginType:
                strategy.marginType === "percentage" ? "rupees" : "percentage",
              margin:
                strategy.marginType === "percentage"
                  ? parseFloat(
                      ((strategy.margin * strategy.basePrice) / 100).toFixed(2)
                    )
                  : parseFloat(
                      ((strategy.margin * 100) / strategy.basePrice).toFixed(2)
                    ),
              lastUpdated: new Date().toLocaleDateString(),
            }
          : strategy
      )
    );
  };

  const handleStatusChange = (id: string) => {
    setStrategies((prev) =>
      prev.map((strategy) =>
        strategy.id === id
          ? {
              ...strategy,
              status: strategy.status === "active" ? "inactive" : "active",
              lastUpdated: new Date().toLocaleDateString(),
            }
          : strategy
      )
    );
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStrategies(generateRandomStrategies(8));
    setEditingMargin(null);
    setIsRefreshing(false);
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
                    <Button variant="outline" size="sm">
                      Save
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
