from app.crawler.parser import parse_html

SAMPLE_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>  Example Page Title  </title>
  <meta name="description" content="A short description of the page.">
  <link rel="canonical" href="https://example.com/canonical">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Sub Heading One</h2>
  <h2>Sub Heading Two</h2>
  <p>Some visible paragraph text with several words in it.</p>
  <img src="/logo.png" alt="Company logo">
  <img src="/spacer.gif">
  <a href="/about">About us</a>
  <a href="https://external.com/page">External link</a>
  <a href="#section">Jump link</a>
  <a href="mailto:hi@example.com">Email us</a>
  <script>var shouldNotCount = "in word count";</script>
</body>
</html>
"""


def test_extracts_title_and_strips_whitespace():
    result = parse_html(SAMPLE_HTML)
    assert result.title == "Example Page Title"


def test_extracts_meta_description():
    result = parse_html(SAMPLE_HTML)
    assert result.meta_description == "A short description of the page."


def test_extracts_headings():
    result = parse_html(SAMPLE_HTML)
    assert result.h1s == ["Main Heading"]
    assert result.h2s == ["Sub Heading One", "Sub Heading Two"]


def test_extracts_canonical():
    result = parse_html(SAMPLE_HTML)
    assert result.canonical_url == "https://example.com/canonical"


def test_indexable_by_default():
    result = parse_html(SAMPLE_HTML)
    assert result.is_indexable is True


def test_noindex_detected():
    html = '<html><head><meta name="robots" content="noindex, nofollow"></head><body></body></html>'
    result = parse_html(html)
    assert result.is_indexable is False


def test_missing_title_and_description_are_none():
    result = parse_html("<html><head></head><body><p>hi</p></body></html>")
    assert result.title is None
    assert result.meta_description is None


def test_extracts_images_with_and_without_alt():
    result = parse_html(SAMPLE_HTML)
    assert {"src": "/logo.png", "alt": "Company logo"} in result.images
    assert {"src": "/spacer.gif", "alt": None} in result.images


def test_extracts_links_and_skips_fragments_and_mailto():
    result = parse_html(SAMPLE_HTML)
    hrefs = [link.href for link in result.links]
    assert "/about" in hrefs
    assert "https://external.com/page" in hrefs
    assert "#section" not in hrefs
    assert "mailto:hi@example.com" not in hrefs


def test_word_count_excludes_script_content():
    without_script = parse_html(SAMPLE_HTML).word_count
    with_more_script = parse_html(
        SAMPLE_HTML.replace(
            "</body>", "<script>var a=1; var b=2; var reallyLongScriptVariableName=3;</script></body>"
        )
    ).word_count
    assert without_script == with_more_script
