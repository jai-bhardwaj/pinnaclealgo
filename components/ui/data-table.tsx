import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "./pagination";
import { PageSizeSelector } from "./page-size-selector";
import { RefreshCw } from "lucide-react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptySubMessage?: string;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPagination?: boolean;
  // Search and filter props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  // Actions
  actions?: React.ReactNode;
  onRefresh?: () => void;
  className?: string;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = "No data found",
  emptySubMessage = "Try adjusting your search or filters",
  // Pagination
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  showPagination = false,
  // Search and filters
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  // Actions
  actions,
  onRefresh,
  className = "",
  rowClassName,
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mx-auto mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
        <p className="text-gray-400 text-sm">{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      {(onSearchChange || filters || actions) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            {onSearchChange && (
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
            
            {filters && filters}
            
            {showPagination && onPageSizeChange && (
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </div>

          {actions && actions}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={`font-medium text-gray-700 ${column.className || ""}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className={rowClassName ? rowClassName(item) : "hover:bg-gray-50"}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
} 