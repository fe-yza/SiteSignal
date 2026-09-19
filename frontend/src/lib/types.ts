export interface Website {
  id: string;
  url: string;
  domain: string;
  display_name: string;
  created_at: string;
}

export type AuditStatus = "pending" | "crawling" | "analyzing" | "completed" | "failed";

export interface Audit {
  id: string;
  website_id: string;
  status: AuditStatus;
  pages_crawled: number;
  pages_limit: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type IssueSeverity = "critical" | "warning" | "opportunity";
export type IssueCategory = "technical" | "on_page" | "content" | "internal_linking" | "indexability";

export interface SEOIssue {
  id: string;
  page_id: string;
  issue_type: string;
  severity: IssueSeverity;
  category: IssueCategory;
  explanation: string;
  recommended_action: string;
}

export interface SEOIssueWithPage extends SEOIssue {
  page_url: string;
}

export interface PageSummary {
  id: string;
  url: string;
  status_code: number | null;
  title: string | null;
  word_count: number;
  crawl_depth: number;
  is_indexable: boolean;
  internal_link_count: number;
  external_link_count: number;
  issue_count: number;
}

export interface PageImage {
  src: string;
  alt: string | null;
}

export interface PageDetail {
  id: string;
  url: string;
  status_code: number | null;
  crawl_depth: number;
  response_time_ms: number | null;
  redirect_count: number;
  canonical_url: string | null;
  title: string | null;
  meta_description: string | null;
  h1s: string[];
  h2s: string[];
  word_count: number;
  images: PageImage[];
  internal_link_count: number;
  external_link_count: number;
  is_indexable: boolean;
  robots_meta: string | null;
  fetch_error: string | null;
  created_at: string;
  incoming_internal_link_count: number;
  issues: SEOIssue[];
}

export interface Opportunity {
  id: string;
  issue_type: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  explanation: string;
  recommended_action: string;
  affected_page_ids: string[];
  affected_page_count: number;
  score: number;
  score_breakdown: Record<string, string | number>;
}

export interface InternalLinkSummary {
  page_id: string;
  url: string;
  incoming_count: number;
  outgoing_count: number;
  few_incoming_links: boolean;
}
