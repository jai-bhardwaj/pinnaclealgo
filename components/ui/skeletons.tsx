import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text";
  size?: "sm" | "md" | "lg";
}

function Skeleton({
  className,
  variant = "default",
  size = "md",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        {
          "rounded-full": variant === "circular",
          "h-4": variant === "text",
          "h-8 w-8": size === "sm",
          "h-12 w-12": size === "md",
          "h-16 w-16": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}

// Specific skeleton components for common UI patterns
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Table header skeleton */}
      <div className="flex space-x-4 pb-2 border-b">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 py-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="relative h-64 w-full">
        <Skeleton className="h-full w-full rounded-lg" />
        {/* Simulate chart lines */}
        <div className="absolute inset-4 space-y-2">
          <Skeleton className="h-1 w-full opacity-50" />
          <Skeleton className="h-1 w-4/5 opacity-50" />
          <Skeleton className="h-1 w-3/5 opacity-50" />
          <Skeleton className="h-1 w-5/6 opacity-50" />
        </div>
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      <div className="flex space-x-2 justify-end">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <CardSkeleton />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={8} />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-2 justify-end pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export { Skeleton };
