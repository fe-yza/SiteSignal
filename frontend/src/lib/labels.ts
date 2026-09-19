import type { IssueCategory } from "@/lib/types";

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  technical: "Technical",
  on_page: "On-page",
  content: "Content",
  internal_linking: "Internal linking",
  indexability: "Indexability",
};

export function formatCategory(category: IssueCategory): string {
  return CATEGORY_LABELS[category];
}
