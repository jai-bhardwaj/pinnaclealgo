import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
  totalItems = 0,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const updatePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage, hasPrevPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPageSize: updatePageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
} 