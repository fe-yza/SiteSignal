import "server-only";

import { backendFetch } from "@/lib/backend";
import type {
  InternalLinkSummary,
  Opportunity,
  PageDetail,
  PageSummary,
  SEOIssueWithPage,
} from "@/lib/types";

export function listPages(websiteId: string, auditId: string): Promise<PageSummary[]> {
  return backendFetch<PageSummary[]>(`/api/websites/${websiteId}/audits/${auditId}/pages`);
}

export function getPage(websiteId: string, auditId: string, pageId: string): Promise<PageDetail> {
  return backendFetch<PageDetail>(`/api/websites/${websiteId}/audits/${auditId}/pages/${pageId}`);
}

export function listIssues(websiteId: string, auditId: string): Promise<SEOIssueWithPage[]> {
  return backendFetch<SEOIssueWithPage[]>(`/api/websites/${websiteId}/audits/${auditId}/issues`);
}

export function listOpportunities(websiteId: string, auditId: string): Promise<Opportunity[]> {
  return backendFetch<Opportunity[]>(`/api/websites/${websiteId}/audits/${auditId}/opportunities`);
}

export function listInternalLinks(
  websiteId: string,
  auditId: string
): Promise<InternalLinkSummary[]> {
  return backendFetch<InternalLinkSummary[]>(
    `/api/websites/${websiteId}/audits/${auditId}/internal-links`
  );
}
