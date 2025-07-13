"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Download, 
  RefreshCw, 
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  IndianRupee
} from "lucide-react";
import { 
  Order, 
  OrdersTableProps, 
  STATUS_CONFIG, 
  STATUS_OPTIONS 
} from "@/types/orders";

export const OrdersTable = observer(({
  orders,
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
  onRefresh,
  onExport,
  highlightNewRows = false,
}: OrdersTableProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        hover: "hover:bg-yellow-200",
      },
      COMPLETE: {
        color: "bg-green-100 text-green-800",
        hover: "hover:bg-green-200",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        hover: "hover:bg-green-200",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        hover: "hover:bg-red-200",
      },
      REJECTED: { 
        color: "bg-red-100 text-red-800", 
        hover: "hover:bg-red-200" 
      },
      PLACED: {
        color: "bg-blue-100 text-blue-800",
        hover: "hover:bg-blue-200",
      },
      OPEN: {
        color: "bg-blue-100 text-blue-800",
        hover: "hover:bg-blue-200",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      hover: "hover:bg-gray-200",
    };

    return (
      <Badge
        variant="outline"
        className={`${config.color} ${config.hover} transition-all duration-200 transform hover:scale-105 select-none min-w-[90px] justify-center gap-1 py-1.5`}
      >
        {status}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Orders</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline" className="border-red-300 text-red-700">
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
                placeholder="Search orders..."
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
                {STATUS_OPTIONS.map((option) => (
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
              Total: {orders.length}
            </Badge>
            <Badge variant="outline" className="h-7">
              Pending: {orders.filter(o => o.status === 'PENDING').length}
            </Badge>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading orders...</p>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-gray-500">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  return (
                    <TableRow 
                      key={order.id} 
                    >
                      <TableCell>{order.symbol}</TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            order.side === "BUY"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.filledQuantity !== undefined &&
                        order.filledQuantity !== null ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="cursor-help">
                                {order.filledQuantity}/{order.quantity}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Filled: {order.filledQuantity}</p>
                              <p>
                                Pending: {order.quantity - order.filledQuantity}
                              </p>
                              <p>Total: {order.quantity}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span>{order.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {formatPrice(order.price || 0)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.placedAt
                          ? new Date(order.placedAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === "PENDING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Cancel order:", order.id);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
          </div>
          
          <div className="flex items-center gap-4">
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
        </div>
      </div>
    </TooltipProvider>
  );
}); 