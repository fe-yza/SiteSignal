import uuid

from app.analysis.opportunity_engine import build_opportunities
from app.analysis.types import IssueDraft, PageData
from app.models.seo_issue import IssueCategory, IssueSeverity


def make_page(depth=1) -> PageData:
    return PageData(
        id=uuid.uuid4(),
        url="https://example.com/x",
        status_code=200,
        crawl_depth=depth,
        response_time_ms=100,
        redirect_count=0,
        canonical_url=None,
        title="T",
        meta_description="D",
        h1s=["H"],
        h2s=[],
        word_count=500,
        images=[],
        internal_link_count=1,
        external_link_count=0,
        is_indexable=True,
        robots_meta=None,
        fetch_error=None,
    )


def make_issue(page: PageData, issue_type: str, severity: IssueSeverity) -> IssueDraft:
    return IssueDraft(
        page_id=page.id,
        issue_type=issue_type,
        severity=severity,
        category=IssueCategory.ON_PAGE,
        explanation="explanation",
        recommended_action="action",
    )


def test_groups_issues_by_type():
    pages = [make_page() for _ in range(3)]
    issues = [make_issue(p, "missing_title", IssueSeverity.CRITICAL) for p in pages]
    pages_by_id = {p.id: p for p in pages}

    opportunities = build_opportunities(issues, pages_by_id, total_page_count=3)

    assert len(opportunities) == 1
    assert opportunities[0].issue_type == "missing_title"
    assert opportunities[0].affected_page_count == 3


def test_severity_ordering_at_equal_affected_page_count():
    # Same page count and same effort multiplier isolates severity_weight as
    # the only thing that can move the score.
    pages = [make_page(), make_page()]
    pages_by_id = {p.id: p for p in pages}

    def score_for_severity(severity: IssueSeverity, issue_type: str) -> float:
        issues = [make_issue(p, issue_type, severity) for p in pages]
        return build_opportunities(issues, pages_by_id, total_page_count=2)[0].score

    critical_score = score_for_severity(IssueSeverity.CRITICAL, "missing_title")
    warning_score = score_for_severity(IssueSeverity.WARNING, "missing_title")
    opportunity_score = score_for_severity(IssueSeverity.OPPORTUNITY, "missing_title")

    assert critical_score > warning_score > opportunity_score


def test_severity_can_be_outweighed_by_a_large_enough_page_count_gap():
    # Log-scaling is deliberate: an opportunity-severity issue affecting
    # nearly the whole site can still outrank a critical issue on one page.
    # This documents that behavior rather than assuming severity always wins.
    critical_pages = [make_page()]
    opportunity_pages = [make_page() for _ in range(20)]
    pages = critical_pages + opportunity_pages
    pages_by_id = {p.id: p for p in pages}

    issues = [make_issue(critical_pages[0], "non_200", IssueSeverity.CRITICAL)] + [
        make_issue(p, "missing_alt_text", IssueSeverity.OPPORTUNITY) for p in opportunity_pages
    ]

    opportunities = build_opportunities(issues, pages_by_id, total_page_count=21)
    assert opportunities[0].issue_type == "missing_alt_text"


def test_affected_page_count_scaling_increases_score_but_sublinearly():
    def score_for_n(n: int) -> float:
        pages = [make_page() for _ in range(n)]
        pages_by_id = {p.id: p for p in pages}
        issues = [make_issue(p, "missing_title", IssueSeverity.WARNING) for p in pages]
        return build_opportunities(issues, pages_by_id, total_page_count=n)[0].score

    score_1 = score_for_n(1)
    score_2 = score_for_n(2)
    score_10 = score_for_n(10)

    assert score_2 > score_1
    assert score_10 > score_2
    # log-scaling: doubling affected count from 1->2 should NOT double the score
    # the way a linear scale would.
    assert score_2 / score_1 < 2.0


def test_shallower_pages_score_higher_than_deeper_pages():
    shallow_pages = [make_page(depth=0)]
    deep_pages = [make_page(depth=5)]

    shallow_issues = [make_issue(p, "missing_title", IssueSeverity.WARNING) for p in shallow_pages]
    deep_issues = [make_issue(p, "missing_meta_description", IssueSeverity.WARNING) for p in deep_pages]

    shallow_score = build_opportunities(
        shallow_issues, {p.id: p for p in shallow_pages}, total_page_count=1
    )[0].score
    deep_score = build_opportunities(deep_issues, {p.id: p for p in deep_pages}, total_page_count=1)[
        0
    ].score

    assert shallow_score > deep_score


def test_score_breakdown_is_fully_derivable():
    pages = [make_page(), make_page()]
    pages_by_id = {p.id: p for p in pages}
    issues = [make_issue(p, "missing_title", IssueSeverity.CRITICAL) for p in pages]

    opportunity = build_opportunities(issues, pages_by_id, total_page_count=2)[0]
    breakdown = opportunity.score_breakdown

    recomputed = (
        breakdown["severity_weight"]
        * breakdown["log_scaled_count"]
        * breakdown["depth_factor"]
        * breakdown["effort_multiplier"]
    )
    assert round(recomputed, 2) == round(opportunity.score, 2)


def test_sorted_descending_by_score():
    pages = [make_page() for _ in range(5)]
    pages_by_id = {p.id: p for p in pages}
    issues = [make_issue(pages[0], "non_200", IssueSeverity.CRITICAL)] + [
        make_issue(p, "missing_alt_text", IssueSeverity.OPPORTUNITY) for p in pages[1:]
    ]

    opportunities = build_opportunities(issues, pages_by_id, total_page_count=5)
    scores = [o.score for o in opportunities]
    assert scores == sorted(scores, reverse=True)
