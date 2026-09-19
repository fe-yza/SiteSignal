"""Deterministic SEO rules engine.

Each rule is a small pure function: (page, audit context) -> issue drafts.
No rule touches a database session or does network I/O, so every rule is
testable with plain Python objects. Content/on-page rules are skipped for
pages that didn't return a 2xx — there's nothing meaningful to say about the
title of a 404.
"""

from collections.abc import Callable

from app.analysis.thresholds import (
    FEW_INCOMING_LINKS_THRESHOLD,
    META_DESCRIPTION_MAX_LENGTH,
    META_DESCRIPTION_MIN_LENGTH,
    REDIRECT_CHAIN_MIN_HOPS,
    SLOW_RESPONSE_MS,
    THIN_CONTENT_LOW_WORDS,
    THIN_CONTENT_VERY_LOW_WORDS,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH,
)
from app.analysis.types import AuditContext, IssueDraft, PageData
from app.models.seo_issue import IssueCategory, IssueSeverity

Rule = Callable[[PageData, AuditContext], list[IssueDraft]]


def _draft(
    page: PageData,
    issue_type: str,
    severity: IssueSeverity,
    category: IssueCategory,
    explanation: str,
    recommended_action: str,
) -> IssueDraft:
    return IssueDraft(
        page_id=page.id,
        issue_type=issue_type,
        severity=severity,
        category=category,
        explanation=explanation,
        recommended_action=recommended_action,
    )


# ---------------------------------------------------------------------------
# Titles
# ---------------------------------------------------------------------------


def rule_missing_title(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or (page.title and page.title.strip()):
        return []
    return [
        _draft(
            page,
            "missing_title",
            IssueSeverity.CRITICAL,
            IssueCategory.ON_PAGE,
            "This page has no <title> tag, or it's empty. Search engines rely on the "
            "title as the primary headline shown in search results.",
            "Add a unique, descriptive title between 30 and 60 characters.",
        )
    ]


def rule_title_too_short(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.title:
        return []
    length = len(page.title.strip())
    if length == 0 or length >= TITLE_MIN_LENGTH:
        return []
    return [
        _draft(
            page,
            "title_too_short",
            IssueSeverity.WARNING,
            IssueCategory.ON_PAGE,
            f"The title is only {length} characters. Short titles often under-use the "
            "space search engines give you and under-describe the page.",
            f"Expand the title to at least {TITLE_MIN_LENGTH} characters, ideally up to {TITLE_MAX_LENGTH}.",
        )
    ]


def rule_title_too_long(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.title:
        return []
    length = len(page.title.strip())
    if length <= TITLE_MAX_LENGTH:
        return []
    return [
        _draft(
            page,
            "title_too_long",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            f"The title is {length} characters and will likely be truncated in search results "
            f"(search engines typically show around {TITLE_MAX_LENGTH}).",
            f"Shorten the title to under {TITLE_MAX_LENGTH} characters, keeping the most important words first.",
        )
    ]


def rule_duplicate_title(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.title or not page.title.strip():
        return []
    normalized = page.title.strip().lower()
    matches = [
        p for p in context.pages if p.is_success and p.title and p.title.strip().lower() == normalized
    ]
    if len(matches) < 2:
        return []
    return [
        _draft(
            page,
            "duplicate_title",
            IssueSeverity.WARNING,
            IssueCategory.ON_PAGE,
            f"This exact title is used on {len(matches)} pages. Duplicate titles make it hard "
            "for search engines (and users) to tell pages apart in results.",
            "Write a unique title for this page that reflects its specific content.",
        )
    ]


# ---------------------------------------------------------------------------
# Meta descriptions
# ---------------------------------------------------------------------------


def rule_missing_meta_description(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or (page.meta_description and page.meta_description.strip()):
        return []
    return [
        _draft(
            page,
            "missing_meta_description",
            IssueSeverity.WARNING,
            IssueCategory.ON_PAGE,
            "This page has no meta description, so search engines will auto-generate a "
            "snippet from page content — often less compelling than a written one.",
            f"Write a meta description between {META_DESCRIPTION_MIN_LENGTH} and "
            f"{META_DESCRIPTION_MAX_LENGTH} characters that summarizes the page and invites a click.",
        )
    ]


def rule_meta_description_too_short(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.meta_description:
        return []
    length = len(page.meta_description.strip())
    if length == 0 or length >= META_DESCRIPTION_MIN_LENGTH:
        return []
    return [
        _draft(
            page,
            "meta_description_too_short",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            f"The meta description is only {length} characters, leaving space in the search "
            "snippet unused.",
            f"Expand the meta description to at least {META_DESCRIPTION_MIN_LENGTH} characters.",
        )
    ]


def rule_meta_description_too_long(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.meta_description:
        return []
    length = len(page.meta_description.strip())
    if length <= META_DESCRIPTION_MAX_LENGTH:
        return []
    return [
        _draft(
            page,
            "meta_description_too_long",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            f"The meta description is {length} characters and will likely be truncated "
            f"(search engines typically show around {META_DESCRIPTION_MAX_LENGTH}).",
            f"Shorten the meta description to under {META_DESCRIPTION_MAX_LENGTH} characters.",
        )
    ]


def rule_duplicate_meta_description(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.meta_description or not page.meta_description.strip():
        return []
    normalized = page.meta_description.strip().lower()
    matches = [
        p
        for p in context.pages
        if p.is_success and p.meta_description and p.meta_description.strip().lower() == normalized
    ]
    if len(matches) < 2:
        return []
    return [
        _draft(
            page,
            "duplicate_meta_description",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            f"This exact meta description is used on {len(matches)} pages.",
            "Write a unique meta description for this page.",
        )
    ]


# ---------------------------------------------------------------------------
# Headings
# ---------------------------------------------------------------------------


def rule_missing_h1(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    non_empty_h1s = [h for h in page.h1s if h.strip()]
    if non_empty_h1s:
        return []
    return [
        _draft(
            page,
            "missing_h1",
            IssueSeverity.WARNING,
            IssueCategory.ON_PAGE,
            "This page has no H1 heading. The H1 signals the main topic of the page to "
            "both users and search engines.",
            "Add a single H1 that clearly states what the page is about.",
        )
    ]


def rule_multiple_h1(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    non_empty_h1s = [h for h in page.h1s if h.strip()]
    if len(non_empty_h1s) < 2:
        return []
    return [
        _draft(
            page,
            "multiple_h1",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            f"This page has {len(non_empty_h1s)} H1 headings, which can dilute the signal "
            "of what the page's main topic is.",
            "Keep a single H1 and demote the others to H2 or lower.",
        )
    ]


def rule_empty_h1(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    has_empty = any(not h.strip() for h in page.h1s)
    if not has_empty:
        return []
    return [
        _draft(
            page,
            "empty_h1",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.ON_PAGE,
            "This page has an H1 tag with no text content.",
            "Remove the empty H1 or fill it with a heading that describes the page.",
        )
    ]


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------


def rule_thin_content_very_low(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or page.word_count >= THIN_CONTENT_VERY_LOW_WORDS:
        return []
    return [
        _draft(
            page,
            "thin_content_very_low",
            IssueSeverity.CRITICAL,
            IssueCategory.CONTENT,
            f"This page has only {page.word_count} words — very little for search engines "
            "to understand what it's about or rank it for anything specific.",
            "Add substantive, unique content, or consider consolidating this page with a related one.",
        )
    ]


def rule_thin_content_low(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    if page.word_count < THIN_CONTENT_VERY_LOW_WORDS or page.word_count >= THIN_CONTENT_LOW_WORDS:
        return []
    return [
        _draft(
            page,
            "thin_content_low",
            IssueSeverity.WARNING,
            IssueCategory.CONTENT,
            f"This page has {page.word_count} words, which is thin relative to what typically "
            "ranks well for competitive queries.",
            "Expand the content with more detail, examples, or supporting sections.",
        )
    ]


def rule_missing_alt_text(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    missing = [img for img in page.images if not (img.get("alt") or "").strip()]
    if not missing:
        return []
    return [
        _draft(
            page,
            "missing_alt_text",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.CONTENT,
            f"{len(missing)} of {len(page.images)} images on this page have no alt text, "
            "which hurts image search visibility and accessibility.",
            "Add descriptive alt text to every meaningful image.",
        )
    ]


# ---------------------------------------------------------------------------
# Indexability / technical
# ---------------------------------------------------------------------------


def rule_noindex(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or page.is_indexable:
        return []
    return [
        _draft(
            page,
            "noindex",
            IssueSeverity.WARNING,
            IssueCategory.INDEXABILITY,
            "This page's robots meta tag tells search engines not to index it.",
            "If this page should appear in search results, remove the noindex directive.",
        )
    ]


def rule_canonical_mismatch(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.canonical_url:
        return []
    if page.canonical_url.rstrip("/") == page.url.rstrip("/"):
        return []
    return [
        _draft(
            page,
            "canonical_mismatch",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.INDEXABILITY,
            f"This page's canonical tag points to a different URL ({page.canonical_url}). "
            "If that's unintentional, this page's ranking signals may be attributed elsewhere.",
            "Confirm the canonical URL is intentional, or point it back to this page's own URL.",
        )
    ]


def rule_non_200(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if page.is_success:
        return []
    if page.status_code is None:
        explanation = f"This page failed to load: {page.fetch_error or 'unknown error'}."
    else:
        explanation = f"This page returned a {page.status_code} status."
    return [
        _draft(
            page,
            "non_200",
            IssueSeverity.CRITICAL,
            IssueCategory.TECHNICAL,
            explanation,
            "Fix the underlying error, or remove internal links pointing to this URL if it's meant to be gone.",
        )
    ]


def rule_slow_response(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if page.response_time_ms is None or page.response_time_ms < SLOW_RESPONSE_MS:
        return []
    return [
        _draft(
            page,
            "slow_response",
            IssueSeverity.WARNING,
            IssueCategory.TECHNICAL,
            f"This page took {page.response_time_ms}ms to respond, which is slow enough to "
            "affect both user experience and crawl efficiency.",
            "Investigate server response time — caching, database queries, or hosting capacity are common causes.",
        )
    ]


def rule_redirect_chains(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if page.redirect_count < REDIRECT_CHAIN_MIN_HOPS:
        return []
    return [
        _draft(
            page,
            "redirect_chains",
            IssueSeverity.WARNING,
            IssueCategory.TECHNICAL,
            f"Reaching this page required {page.redirect_count} redirect hops, which wastes "
            "crawl budget and slows down page load.",
            "Update the original link or reference to point directly at the final URL.",
        )
    ]


# ---------------------------------------------------------------------------
# Internal linking
# ---------------------------------------------------------------------------


def rule_broken_internal_links(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success:
        return []
    broken = context.broken_internal_link_targets.get(page.id, [])
    if not broken:
        return []
    return [
        _draft(
            page,
            "broken_internal_links",
            IssueSeverity.CRITICAL,
            IssueCategory.INTERNAL_LINKING,
            f"This page links to {len(broken)} internal URL(s) that return an error or failed to load.",
            "Update or remove the broken links so users and search engines aren't led to dead ends.",
        )
    ]


def rule_few_incoming_links(page: PageData, context: AuditContext) -> list[IssueDraft]:
    if not page.is_success or not page.is_indexable:
        return []
    if page.crawl_depth == 0:
        return []  # the homepage is always well-linked by definition
    incoming = context.incoming_internal_link_counts.get(page.id, 0)
    if incoming >= FEW_INCOMING_LINKS_THRESHOLD:
        return []
    return [
        _draft(
            page,
            "few_incoming_links",
            IssueSeverity.OPPORTUNITY,
            IssueCategory.INTERNAL_LINKING,
            f"Only {incoming} other page(s) on the site link to this page internally, making it "
            "harder for search engines to discover and for link equity to flow to it.",
            "Add internal links to this page from relevant, higher-traffic pages.",
        )
    ]


ALL_RULES: list[Rule] = [
    rule_missing_title,
    rule_title_too_short,
    rule_title_too_long,
    rule_duplicate_title,
    rule_missing_meta_description,
    rule_meta_description_too_short,
    rule_meta_description_too_long,
    rule_duplicate_meta_description,
    rule_missing_h1,
    rule_multiple_h1,
    rule_empty_h1,
    rule_thin_content_very_low,
    rule_thin_content_low,
    rule_missing_alt_text,
    rule_noindex,
    rule_canonical_mismatch,
    rule_non_200,
    rule_slow_response,
    rule_redirect_chains,
    rule_broken_internal_links,
    rule_few_incoming_links,
]


def run_rules(context: AuditContext, rules: list[Rule] = ALL_RULES) -> list[IssueDraft]:
    drafts: list[IssueDraft] = []
    for page in context.pages:
        for rule in rules:
            drafts.extend(rule(page, context))
    return drafts
