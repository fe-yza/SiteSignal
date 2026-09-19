import uuid

import pytest

from app.analysis import rules
from app.analysis.thresholds import (
    FEW_INCOMING_LINKS_THRESHOLD,
    META_DESCRIPTION_MAX_LENGTH,
    META_DESCRIPTION_MIN_LENGTH,
    SLOW_RESPONSE_MS,
    THIN_CONTENT_LOW_WORDS,
    THIN_CONTENT_VERY_LOW_WORDS,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH,
)
from app.analysis.types import AuditContext, PageData


def make_page(**overrides) -> PageData:
    defaults = dict(
        id=uuid.uuid4(),
        url="https://example.com/page",
        status_code=200,
        crawl_depth=1,
        response_time_ms=200,
        redirect_count=0,
        canonical_url=None,
        title="A perfectly good title that is long enough",
        meta_description="A" * 100,
        h1s=["Main heading"],
        h2s=[],
        word_count=500,
        images=[],
        internal_link_count=1,
        external_link_count=0,
        is_indexable=True,
        robots_meta=None,
        fetch_error=None,
    )
    defaults.update(overrides)
    return PageData(**defaults)


def make_context(pages, incoming=None, broken=None) -> AuditContext:
    return AuditContext(
        pages=pages,
        incoming_internal_link_counts=incoming or {},
        broken_internal_link_targets=broken or {},
    )


# --- titles -----------------------------------------------------------------


def test_missing_title_fires_when_title_is_none():
    page = make_page(title=None)
    ctx = make_context([page])
    issues = rules.rule_missing_title(page, ctx)
    assert len(issues) == 1
    assert issues[0].issue_type == "missing_title"


def test_missing_title_skipped_on_non_200():
    page = make_page(title=None, status_code=404)
    ctx = make_context([page])
    assert rules.rule_missing_title(page, ctx) == []


def test_title_too_short():
    page = make_page(title="x" * (TITLE_MIN_LENGTH - 1))
    ctx = make_context([page])
    assert len(rules.rule_title_too_short(page, ctx)) == 1


def test_title_exactly_at_min_length_is_fine():
    page = make_page(title="x" * TITLE_MIN_LENGTH)
    ctx = make_context([page])
    assert rules.rule_title_too_short(page, ctx) == []


def test_title_too_long():
    page = make_page(title="x" * (TITLE_MAX_LENGTH + 1))
    ctx = make_context([page])
    assert len(rules.rule_title_too_long(page, ctx)) == 1


def test_duplicate_title_detected_across_pages():
    page1 = make_page(title="Same Title Here")
    page2 = make_page(title="Same Title Here")
    ctx = make_context([page1, page2])
    assert len(rules.rule_duplicate_title(page1, ctx)) == 1
    assert len(rules.rule_duplicate_title(page2, ctx)) == 1


def test_duplicate_title_not_flagged_when_unique():
    page1 = make_page(title="Title One")
    page2 = make_page(title="Title Two")
    ctx = make_context([page1, page2])
    assert rules.rule_duplicate_title(page1, ctx) == []


def test_duplicate_title_case_insensitive():
    page1 = make_page(title="Same Title")
    page2 = make_page(title="same title")
    ctx = make_context([page1, page2])
    assert len(rules.rule_duplicate_title(page1, ctx)) == 1


# --- meta descriptions --------------------------------------------------


def test_missing_meta_description():
    page = make_page(meta_description=None)
    ctx = make_context([page])
    assert len(rules.rule_missing_meta_description(page, ctx)) == 1


def test_meta_description_too_short():
    page = make_page(meta_description="x" * (META_DESCRIPTION_MIN_LENGTH - 1))
    ctx = make_context([page])
    assert len(rules.rule_meta_description_too_short(page, ctx)) == 1


def test_meta_description_too_long():
    page = make_page(meta_description="x" * (META_DESCRIPTION_MAX_LENGTH + 1))
    ctx = make_context([page])
    assert len(rules.rule_meta_description_too_long(page, ctx)) == 1


def test_duplicate_meta_description():
    page1 = make_page(meta_description="Same description text goes here padded out to length.")
    page2 = make_page(meta_description="Same description text goes here padded out to length.")
    ctx = make_context([page1, page2])
    assert len(rules.rule_duplicate_meta_description(page1, ctx)) == 1


# --- headings -------------------------------------------------------------


def test_missing_h1():
    page = make_page(h1s=[])
    ctx = make_context([page])
    assert len(rules.rule_missing_h1(page, ctx)) == 1


def test_multiple_h1():
    page = make_page(h1s=["First", "Second"])
    ctx = make_context([page])
    assert len(rules.rule_multiple_h1(page, ctx)) == 1


def test_single_h1_not_flagged():
    page = make_page(h1s=["Only one"])
    ctx = make_context([page])
    assert rules.rule_multiple_h1(page, ctx) == []
    assert rules.rule_missing_h1(page, ctx) == []


def test_empty_h1():
    page = make_page(h1s=["   "])
    ctx = make_context([page])
    assert len(rules.rule_empty_h1(page, ctx)) == 1
    # An empty-text H1 tag still counts as "no H1" for the missing-h1 rule.
    assert len(rules.rule_missing_h1(page, ctx)) == 1


# --- thin content -----------------------------------------------------------


def test_thin_content_very_low():
    page = make_page(word_count=THIN_CONTENT_VERY_LOW_WORDS - 1)
    ctx = make_context([page])
    assert len(rules.rule_thin_content_very_low(page, ctx)) == 1
    assert rules.rule_thin_content_low(page, ctx) == []


def test_thin_content_low():
    page = make_page(word_count=THIN_CONTENT_VERY_LOW_WORDS)
    ctx = make_context([page])
    assert rules.rule_thin_content_very_low(page, ctx) == []
    assert len(rules.rule_thin_content_low(page, ctx)) == 1


def test_thin_content_not_flagged_above_low_threshold():
    page = make_page(word_count=THIN_CONTENT_LOW_WORDS)
    ctx = make_context([page])
    assert rules.rule_thin_content_low(page, ctx) == []


def test_missing_alt_text():
    page = make_page(images=[{"src": "a.png", "alt": None}, {"src": "b.png", "alt": "Described"}])
    ctx = make_context([page])
    issues = rules.rule_missing_alt_text(page, ctx)
    assert len(issues) == 1
    assert "1 of 2" in issues[0].explanation


def test_all_images_have_alt_not_flagged():
    page = make_page(images=[{"src": "a.png", "alt": "Described"}])
    ctx = make_context([page])
    assert rules.rule_missing_alt_text(page, ctx) == []


# --- indexability / technical ------------------------------------------


def test_noindex_flagged():
    page = make_page(is_indexable=False, robots_meta="noindex")
    ctx = make_context([page])
    assert len(rules.rule_noindex(page, ctx)) == 1


def test_canonical_mismatch():
    page = make_page(url="https://example.com/a", canonical_url="https://example.com/b")
    ctx = make_context([page])
    assert len(rules.rule_canonical_mismatch(page, ctx)) == 1


def test_canonical_matching_self_not_flagged():
    page = make_page(url="https://example.com/a", canonical_url="https://example.com/a")
    ctx = make_context([page])
    assert rules.rule_canonical_mismatch(page, ctx) == []


def test_non_200_flagged_for_error_status():
    page = make_page(status_code=404)
    ctx = make_context([page])
    assert len(rules.rule_non_200(page, ctx)) == 1


def test_non_200_flagged_for_fetch_failure():
    page = make_page(status_code=None, fetch_error="Request failed: timeout")
    ctx = make_context([page])
    assert len(rules.rule_non_200(page, ctx)) == 1


def test_non_200_not_flagged_for_success():
    page = make_page(status_code=200)
    ctx = make_context([page])
    assert rules.rule_non_200(page, ctx) == []


def test_slow_response_flagged():
    page = make_page(response_time_ms=SLOW_RESPONSE_MS)
    ctx = make_context([page])
    assert len(rules.rule_slow_response(page, ctx)) == 1


def test_fast_response_not_flagged():
    page = make_page(response_time_ms=SLOW_RESPONSE_MS - 1)
    ctx = make_context([page])
    assert rules.rule_slow_response(page, ctx) == []


def test_redirect_chain_flagged():
    page = make_page(redirect_count=2)
    ctx = make_context([page])
    assert len(rules.rule_redirect_chains(page, ctx)) == 1


def test_single_redirect_not_a_chain():
    page = make_page(redirect_count=1)
    ctx = make_context([page])
    assert rules.rule_redirect_chains(page, ctx) == []


# --- internal linking -------------------------------------------------------


def test_broken_internal_links_flagged():
    page = make_page()
    ctx = make_context([page], broken={page.id: ["https://example.com/dead"]})
    assert len(rules.rule_broken_internal_links(page, ctx)) == 1


def test_no_broken_links_not_flagged():
    page = make_page()
    ctx = make_context([page])
    assert rules.rule_broken_internal_links(page, ctx) == []


def test_few_incoming_links_flagged():
    page = make_page(crawl_depth=2)
    ctx = make_context([page], incoming={page.id: FEW_INCOMING_LINKS_THRESHOLD - 1})
    assert len(rules.rule_few_incoming_links(page, ctx)) == 1


def test_homepage_never_flagged_for_few_incoming_links():
    page = make_page(crawl_depth=0)
    ctx = make_context([page], incoming={page.id: 0})
    assert rules.rule_few_incoming_links(page, ctx) == []


def test_well_linked_page_not_flagged():
    page = make_page(crawl_depth=2)
    ctx = make_context([page], incoming={page.id: FEW_INCOMING_LINKS_THRESHOLD})
    assert rules.rule_few_incoming_links(page, ctx) == []


# --- run_rules aggregation ---------------------------------------------


def test_run_rules_skips_on_page_rules_for_error_pages():
    error_page = make_page(status_code=500, title=None, word_count=0)
    ctx = make_context([error_page])
    issues = rules.run_rules(ctx)
    issue_types = {i.issue_type for i in issues}
    assert "non_200" in issue_types
    assert "missing_title" not in issue_types
    assert "thin_content_very_low" not in issue_types
