"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`?${params.toString()}`);
  }

  function getPageNumbers(): (number | "ellipsis-start" | "ellipsis-end")[] {
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

    // Always show first page
    pages.push(1);

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    if (rangeStart > 2) {
      pages.push("ellipsis-start");
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      pages.push("ellipsis-end");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        <span className="hidden sm:inline">
          Showing{" "}
          <span className="font-medium text-slate-700">{from}</span>
          {" "}to{" "}
          <span className="font-medium text-slate-700">{to}</span>
          {" "}of{" "}
          <span className="font-medium text-slate-700">{totalItems}</span>
          {" "}results
        </span>
        <span className="sm:hidden">
          <span className="font-medium text-slate-700">{from}</span>
          {"\u2013"}
          <span className="font-medium text-slate-700">{to}</span>
          {" of "}
          <span className="font-medium text-slate-700">{totalItems}</span>
        </span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Mobile: simple page indicator */}
        <span className="flex items-center px-2 text-sm text-slate-500 sm:hidden">
          {currentPage} / {totalPages}
        </span>

        {/* Desktop: full page numbers */}
        <div className="hidden sm:flex sm:items-center sm:gap-1">
          {pageNumbers.map((page) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <span
                  key={page}
                  className="flex size-7 items-center justify-center text-sm text-slate-400"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="icon-sm"
                onClick={() => goToPage(page)}
                className={cn(
                  isActive && "pointer-events-none"
                )}
                aria-label={`Page ${page}`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
