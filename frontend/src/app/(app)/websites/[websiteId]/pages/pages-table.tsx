"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PageSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "url" | "status_code" | "word_count" | "issue_count" | "internal_link_count";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "success" | "error";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "url", label: "URL" },
  { key: "status_code", label: "Status" },
  { key: "word_count", label: "Words", align: "right" },
  { key: "internal_link_count", label: "Internal links", align: "right" },
  { key: "issue_count", label: "Issues", align: "right" },
];

export function PagesTable({ websiteId, pages }: { websiteId: string; pages: PageSummary[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("issue_count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        search.trim().length === 0 ||
        page.url.toLowerCase().includes(search.toLowerCase()) ||
        (page.title ?? "").toLowerCase().includes(search.toLowerCase());

      const isSuccess = page.status_code !== null && page.status_code >= 200 && page.status_code < 300;
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "success" ? isSuccess : !isSuccess);

      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      let comparison: number;
      if (typeof aVal === "string" || typeof bVal === "string") {
        comparison = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      } else {
        comparison = (aVal ?? -1) - (bVal ?? -1);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [filtered, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or title"
            className="pl-8"
            aria-label="Search pages"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {(["all", "success", "error"] as StatusFilter[]).map((option) => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                statusFilter === option
                  ? "bg-accent-subtle text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option === "all" ? "All" : option === "success" ? "2xx" : "Errors"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center gap-1 px-6 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">No pages match your filters</p>
          <p className="text-sm text-muted">Try a different search term or clear the status filter.</p>
        </Card>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-xs font-medium text-muted-foreground",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    <button
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-foreground",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((page) => {
                const isSuccess =
                  page.status_code !== null && page.status_code >= 200 && page.status_code < 300;
                return (
                  <tr
                    key={page.id}
                    className="border-b border-border last:border-0 hover:bg-surface-subtle"
                  >
                    <td className="max-w-xs px-4 py-2.5">
                      <Link
                        href={`/websites/${websiteId}/pages/${page.id}`}
                        className="block truncate font-medium text-foreground hover:text-accent"
                        title={page.url}
                      >
                        {page.title || page.url}
                      </Link>
                      <p className="truncate text-xs text-muted">{page.url}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge tone={isSuccess ? "neutral" : "critical"}>
                        {page.status_code ?? "Error"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-foreground">{page.word_count}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">
                      {page.internal_link_count}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {page.issue_count > 0 ? (
                        <Badge tone="warning">{page.issue_count}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
