from dataclasses import dataclass, field

from bs4 import BeautifulSoup

SKIP_HREF_PREFIXES = ("#", "javascript:", "mailto:", "tel:")


@dataclass
class ParsedLink:
    href: str
    anchor_text: str | None


@dataclass
class ParsedPage:
    title: str | None
    meta_description: str | None
    h1s: list[str] = field(default_factory=list)
    h2s: list[str] = field(default_factory=list)
    word_count: int = 0
    canonical_url: str | None = None
    robots_meta: str | None = None
    is_indexable: bool = True
    images: list[dict] = field(default_factory=list)
    links: list[ParsedLink] = field(default_factory=list)


def parse_html(html: str) -> ParsedPage:
    soup = BeautifulSoup(html, "lxml")

    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) or None if title_tag else None

    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = (meta_desc_tag.get("content") or "").strip() or None if meta_desc_tag else None

    h1s = [h.get_text(strip=True) for h in soup.find_all("h1")]
    h2s = [h.get_text(strip=True) for h in soup.find_all("h2")]

    canonical_tag = soup.find("link", rel=lambda v: bool(v) and "canonical" in v)
    canonical_url = (canonical_tag.get("href") or "").strip() or None if canonical_tag else None

    robots_tag = soup.find("meta", attrs={"name": "robots"})
    robots_meta = (robots_tag.get("content") or "").strip() or None if robots_tag else None
    is_indexable = not (robots_meta and "noindex" in robots_meta.lower())

    images = []
    for img in soup.find_all("img"):
        src = (img.get("src") or "").strip()
        if src:
            images.append({"src": src, "alt": img.get("alt")})

    links = []
    for a in soup.find_all("a", href=True):
        href = a.get("href").strip()
        if not href or href.startswith(SKIP_HREF_PREFIXES):
            continue
        anchor_text = a.get_text(strip=True)[:500] or None
        links.append(ParsedLink(href=href, anchor_text=anchor_text))

    # Word count is computed after headings/links are extracted but before
    # non-content tags are stripped, so script/style text never counts.
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    word_count = len(soup.get_text(separator=" ").split())

    return ParsedPage(
        title=title,
        meta_description=meta_description,
        h1s=h1s,
        h2s=h2s,
        word_count=word_count,
        canonical_url=canonical_url,
        robots_meta=robots_meta,
        is_indexable=is_indexable,
        images=images,
        links=links,
    )
