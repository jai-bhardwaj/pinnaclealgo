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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcw, IndianRupee } from "lucide-react";
import { backendApi } from "@/lib/backend_api";

interface Order {
  broker_order_id: string;
  internal_order_id?: string;
  status: string;
  message?: string;
  broker: string;
  symbol: string;
  side: string;
  quantity: number;
  filled_quantity?: number;
  pending_quantity?: number;
  average_price?: number;
  order_type: string;
  product_type: string;
  trigger_price?: number;
  price: number;
  order_timestamp?: string;
}

export function OrderTable() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await backendApi.orders.getAll();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    }
  };

  useEffect(() => {
    if (session?.user?.access_token) {
      fetchOrders();
    }
  }, [session]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const handleCancelOrder = async (brokerOrderId: string) => {
    try {
      const result = await backendApi.orders.cancel(brokerOrderId);
      setMessage(result.message || "Order cancelled successfully");
      await fetchOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", hover: "hover:bg-yellow-200" },
      COMPLETED: { color: "bg-green-100 text-green-800", hover: "hover:bg-green-200" },
      CANCELLED: { color: "bg-red-100 text-red-800", hover: "hover:bg-red-200" },
      REJECTED: { color: "bg-red-100 text-red-800", hover: "hover:bg-red-200" },
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-7">
              Total: {orders.length}
            </Badge>
            <Badge variant="outline" className="h-7">
              Pending: {orders.filter((o) => o.status === "PENDING").length}
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
                <TableHead>Order ID</TableHead>
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
              {orders.map((order) => (
                <TableRow key={order.broker_order_id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="cursor-help">
                          {order.broker_order_id.slice(0, 8)}...
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Broker Order ID: {order.broker_order_id}</p>
                        {order.internal_order_id && (
                          <p>Internal Order ID: {order.internal_order_id}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{order.symbol}</TableCell>
                  <TableCell>{order.order_type}</TableCell>
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
                    {order.filled_quantity !== undefined && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-help">
                            {order.filled_quantity}/{order.quantity}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Filled: {order.filled_quantity}</p>
                          <p>Pending: {order.pending_quantity}</p>
                          <p>Total: {order.quantity}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {formatPrice(order.price)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.order_timestamp
                      ? new Date(order.order_timestamp).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order.broker_order_id)}
                      >
                        Cancel
                      </Button>
                    )}
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