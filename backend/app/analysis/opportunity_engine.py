"""Aggregates individual page-level issues into ranked, explainable
opportunities, grouped by issue_type (e.g. "Add titles to 7 indexable
pages," not seven separate rows).

Scoring is a transparent formula built only from data already stored on the
issue/page rows:

    opportunity_score = severity_weight * log_scaled(affected_page_count) * depth_factor * effort_multiplier

Every factor is stored on the Opportunity row's score_breakdown, so the
number is inspectable rather than a black box.

Phase 9 (not implemented yet, and deliberately not faked): once Search
Console data exists, this expands to weigh in real demand and performance —
    search_demand * ranking_potential * ctr_gap * business_relevance
No search-demand numbers are fabricated in the meantime; the score below
uses only crawl-derived facts.
"""

import math
import uuid
from collections import defaultdict
from dataclasses import dataclass

from app.analysis.types import IssueDraft, PageData
from app.models.seo_issue import IssueCategory, IssueSeverity

# Higher-severity issues should dominate ranking even when they affect fewer
# pages than a lower-severity issue affecting many.
SEVERITY_WEIGHTS: dict[IssueSeverity, float] = {
    IssueSeverity.CRITICAL: 10.0,
    IssueSeverity.WARNING: 5.0,
    IssueSeverity.OPPORTUNITY: 2.0,
}

# Fixing something close to the homepage (shallow depth) tends to matter
# more — it's more likely to be discovered and to pass link equity onward.
# depth_factor = 1 / (1 + average_crawl_depth_of_affected_pages)
def _depth_factor(average_depth: float) -> float:
    return 1.0 / (1.0 + average_depth)


# Rough, transparent stand-in for "how hard is this to fix" until real
# effort tracking exists. Bulk/templated fixes (titles, meta descriptions,
# alt text) are cheap; structural issues (thin content, broken links) cost
# more per page.
EFFORT_MULTIPLIERS: dict[str, float] = {
    "missing_title": 1.0,
    "title_too_short": 1.0,
    "title_too_long": 1.0,
    "duplicate_title": 0.8,
    "missing_meta_description": 1.0,
    "meta_description_too_short": 1.0,
    "meta_description_too_long": 1.0,
    "duplicate_meta_description": 0.8,
    "missing_h1": 0.9,
    "multiple_h1": 0.9,
    "empty_h1": 0.9,
    "thin_content_very_low": 0.4,
    "thin_content_low": 0.5,
    "missing_alt_text": 0.9,
    "noindex": 0.7,
    "canonical_mismatch": 0.6,
    "non_200": 0.5,
    "slow_response": 0.3,
    "redirect_chains": 0.6,
    "broken_internal_links": 0.7,
    "few_incoming_links": 0.5,
}
DEFAULT_EFFORT_MULTIPLIER = 0.6

ISSUE_TITLES: dict[str, str] = {
    "missing_title": "Add missing page titles",
    "title_too_short": "Expand titles that are too short",
    "title_too_long": "Shorten titles that will be truncated",
    "duplicate_title": "Fix duplicate page titles",
    "missing_meta_description": "Add missing meta descriptions",
    "meta_description_too_short": "Expand short meta descriptions",
    "meta_description_too_long": "Shorten long meta descriptions",
    "duplicate_meta_description": "Fix duplicate meta descriptions",
    "missing_h1": "Add missing H1 headings",
    "multiple_h1": "Fix pages with multiple H1 headings",
    "empty_h1": "Fill in empty H1 headings",
    "thin_content_very_low": "Expand pages with almost no content",
    "thin_content_low": "Expand thin-content pages",
    "missing_alt_text": "Add missing image alt text",
    "noindex": "Review pages blocked from indexing",
    "canonical_mismatch": "Review mismatched canonical tags",
    "non_200": "Fix broken or erroring pages",
    "slow_response": "Speed up slow-responding pages",
    "redirect_chains": "Flatten redirect chains",
    "broken_internal_links": "Fix broken internal links",
    "few_incoming_links": "Add internal links to under-linked pages",
}


@dataclass
class OpportunityDraft:
    issue_type: str
    severity: IssueSeverity
    category: IssueCategory
    title: str
    explanation: str
    recommended_action: str
    affected_page_ids: list[uuid.UUID]
    affected_page_count: int
    score: float
    score_breakdown: dict


def build_opportunities(
    issue_drafts: list[IssueDraft],
    pages_by_id: dict[uuid.UUID, PageData],
    total_page_count: int,
) -> list[OpportunityDraft]:
    grouped: dict[str, list[IssueDraft]] = defaultdict(list)
    for draft in issue_drafts:
        grouped[draft.issue_type].append(draft)

    opportunities: list[OpportunityDraft] = []
    for issue_type, drafts in grouped.items():
        first = drafts[0]
        affected_page_ids = [d.page_id for d in drafts]
        affected_page_count = len(affected_page_ids)

        severity_weight = SEVERITY_WEIGHTS[first.severity]
        log_scaled_count = math.log2(affected_page_count + 1)

        depths = [
            pages_by_id[pid].crawl_depth for pid in affected_page_ids if pid in pages_by_id
        ]
        average_depth = sum(depths) / len(depths) if depths else 0.0
        depth_factor = _depth_factor(average_depth)

        effort_multiplier = EFFORT_MULTIPLIERS.get(issue_type, DEFAULT_EFFORT_MULTIPLIER)

        score = severity_weight * log_scaled_count * depth_factor * effort_multiplier

        opportunities.append(
            OpportunityDraft(
                issue_type=issue_type,
                severity=first.severity,
                category=first.category,
                title=_build_title(issue_type, affected_page_count, total_page_count),
                explanation=first.explanation,
                recommended_action=first.recommended_action,
                affected_page_ids=affected_page_ids,
                affected_page_count=affected_page_count,
                score=round(score, 4),
                score_breakdown={
                    "severity": first.severity.value,
                    "severity_weight": severity_weight,
                    "affected_page_count": affected_page_count,
                    "log_scaled_count": round(log_scaled_count, 4),
                    "average_crawl_depth": round(average_depth, 2),
                    "depth_factor": round(depth_factor, 4),
                    "effort_multiplier": effort_multiplier,
                    "formula": "severity_weight * log2(affected_page_count + 1) * depth_factor * effort_multiplier",
                },
            )
        )

    opportunities.sort(key=lambda o: o.score, reverse=True)
    return opportunities


def _build_title(issue_type: str, affected_page_count: int, total_page_count: int) -> str:
    base = ISSUE_TITLES.get(issue_type, issue_type.replace("_", " ").capitalize())
    noun = "page" if affected_page_count == 1 else "pages"
    return f"{base} ({affected_page_count} of {total_page_count} {noun})"
