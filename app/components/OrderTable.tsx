"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { observer } from "mobx-react-lite";
import { useOrderStore } from "@/stores";
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

export const OrderTable = observer(() => {
  const { data: session } = useSession();
  const orderStore = useOrderStore();
  const { orders, isLoading, error } = orderStore;
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.id) {
      console.error("No user ID available");
      return;
    }
    try {
      await orderStore.fetchOrders();
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, [session?.user?.id, orderStore]);

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session?.user, fetchOrders]);

  const handleRefreshData = async () => {
    await fetchOrders();
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const result = await orderStore.cancelOrder(orderId);
      setMessage("Order cancelled successfully");
      await fetchOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
    }
  };

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
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        hover: "hover:bg-red-200",
      },
      REJECTED: { color: "bg-red-100 text-red-800", hover: "hover:bg-red-200" },
      PLACED: {
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-7">
              Total: {orders.length}
            </Badge>
            <Badge variant="outline" className="h-7">
              Pending: {orderStore.pendingOrders.length}
            </Badge>
          </div>
          <Button
            onClick={handleRefreshData}
            variant="outline"
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCcw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
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
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="cursor-help">
                          {order.brokerOrderId
                            ? order.brokerOrderId.slice(0, 8) + "..."
                            : order.id.slice(0, 8) + "..."}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Order ID: {order.id}</p>
                        {order.brokerOrderId && (
                          <p>Broker Order ID: {order.brokerOrderId}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
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
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
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
});
