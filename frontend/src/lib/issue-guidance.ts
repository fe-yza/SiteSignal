import type { PageDetail } from "@/lib/types";

interface Guide { where: string; steps: string[]; verify: string; note?: string; source?: string }
const google = "https://developers.google.com/search/docs/";
const titles: Guide = {
  where: "Your CMS page’s SEO title field, or the <title> element in the HTML <head>.",
  steps: ["Read the captured title below and open the live page to confirm its main topic.", "Write a concise title describing this specific page. Put the distinguishing topic first; remove repeated boilerplate. For duplicates, compare the affected URLs before choosing unique wording.", "Save and publish the page or shared template, then inspect the delivered HTML to confirm the new title appears once."],
  verify: "Run a new audit and compare the captured title and related issue. Search results may take time to update and may use a different title.",
  note: "SiteSignal’s character limits are review heuristics, not Google limits or a guarantee of truncation.", source: google + "appearance/title-link",
};
const descriptions: Guide = {
  where: "Your CMS SEO description field, or <meta name=\"description\"> in the HTML <head>.",
  steps: ["Read the captured description and identify what makes this page useful or distinct.", "Write a short, accurate summary of that content. Replace duplicated boilerplate; expand vague text with relevant specifics or cut repetition from long descriptions.", "Publish and check that the HTML contains the intended description for this URL, not a site-wide default."],
  verify: "Re-audit and compare the saved description. Google can choose page text instead; changing this field does not force a particular snippet.",
  note: "Length flags are editorial prompts, not fixed search-engine requirements.", source: google + "appearance/snippet",
};
const headings: Guide = {
  where: "The page content editor or the template that renders the visible main heading.",
  steps: ["Compare the captured H1 headings with the live page’s visible main title.", "Add or fill a descriptive main heading if it is missing or empty. If several headings compete as the main title, keep a clear hierarchy and use H2/H3 for subordinate sections.", "Inspect the HTML heading tags after publishing; changing font size alone does not change heading structure."],
  verify: "Re-audit and review the captured H1 list. Confirm the page is understandable with its headings alone.",
  note: "Multiple H1s are a review prompt, not proof of a ranking penalty.", source: google + "appearance/title-link",
};
const content: Guide = {
  where: "The main page content and, if needed, its rendering template.",
  steps: ["Check whether the low captured word count matches the live page. This crawler parses HTML and does not render JavaScript-only content.", "If useful content is missing, answer the visitor’s actual questions with specific information, examples, or instructions. Do not add filler to reach a word count.", "If two pages serve the same purpose, consider consolidating them and deliberately redirecting the retired URL to the relevant replacement."],
  verify: "Re-audit after publishing and review the content itself, not just whether a word-count flag disappeared.",
  note: "A short page can fully satisfy its purpose. Word count alone does not establish quality.", source: google + "fundamentals/creating-helpful-content",
};
export const ISSUE_GUIDES: Record<string, Guide> = {
  missing_title: titles, title_too_short: titles, title_too_long: titles, duplicate_title: titles,
  missing_meta_description: descriptions, meta_description_too_short: descriptions, meta_description_too_long: descriptions, duplicate_meta_description: descriptions,
  missing_h1: headings, multiple_h1: headings, empty_h1: headings,
  thin_content_low: content, thin_content_very_low: content,
  missing_alt_text: {
    where: "The image settings in your content editor or each image’s alt attribute.",
    steps: ["Review the image list below and locate each flagged image in its page context.", "For informative images, describe the information they convey. For linked images, describe the destination or action. Avoid keyword lists.", "For purely decorative images, keep alt=\"\" intentionally. Save the image settings and publish."],
    verify: "Inspect the image markup and re-audit. Decorative empty alt text may remain flagged by this heuristic; that does not mean it should be filled.", source: google + "appearance/google-images",
  },
  noindex: {
    where: "The CMS search-visibility setting, robots meta tag, or server’s X-Robots-Tag header.",
    steps: ["Decide whether this page should appear in search. Private, utility, and staging pages may intentionally be excluded.", "Only if indexing is intended, remove the noindex directive from the responsible template or configuration. Check both the HTML and response headers.", "Confirm the URL is publicly accessible and crawlable. Use Search Console URL Inspection to investigate Google’s current view."],
    verify: "Re-audit to check the captured robots meta. Use URL Inspection for indexing status; this audit does not prove Google indexed the page.", source: google + "crawling-indexing/block-indexing",
  },
  canonical_mismatch: {
    where: "The canonical URL field in your SEO settings or rel=\"canonical\" in the page template.",
    steps: ["Compare this page URL with the captured canonical URL. A different canonical may be intentional for duplicate content.", "If this page should be the preferred version, set its canonical to its own absolute URL. Otherwise confirm the target is the intended equivalent page, accessible and indexable.", "Align internal links and sitemap entries with the preferred URL; remove conflicting canonical declarations."],
    verify: "Re-audit to check the captured canonical. Use Search Console to inspect Google’s selected canonical; the tag is a signal, not a guarantee.", source: google + "crawling-indexing/consolidate-duplicate-urls",
  },
  non_200: {
    where: "The affected URL’s route, hosting configuration, or server logs.",
    steps: ["Open the URL and compare its response with the captured status and fetch error below.", "For an unintended 404, restore the page or redirect to a genuinely relevant replacement. For 5xx errors, investigate application and hosting logs. For blocked or failed requests, check access restrictions and connectivity.", "Update internal links to the working destination. Keep a genuine 404/410 for content intentionally removed without a replacement."],
    verify: "Re-audit and check the response status. Do not return a 200 error page just to clear this flag.",
  },
  slow_response: {
    where: "Your hosting, application request handlers, database queries, and caching configuration.",
    steps: ["Repeat the request to distinguish a persistent delay from a one-off network or cold-start event.", "Use server timing and logs to identify expensive queries, upstream calls, redirects, or uncached page generation. Fix the measured bottleneck.", "Compare repeated measurements after deploying. Use PageSpeed Insights separately to investigate browser rendering performance."],
    verify: "Re-audit and compare response times under similar conditions. This measurement is not Core Web Vitals and does not identify the cause by itself.",
  },
  redirect_chains: {
    where: "Hosting redirect rules, CMS redirect settings, and links pointing to old URLs.",
    steps: ["Follow the URL in the browser Network panel or an HTTP tool to identify each redirect hop.", "Where you control the redirects, point the original URL directly to the correct final destination. Check for HTTPS, hostname, and trailing-slash rules that stack.", "Update internal links to the final URL and confirm the destination serves the expected content."],
    verify: "Re-audit and compare the redirect count. The current audit records a count, not the full hop sequence.",
  },
  broken_internal_links: {
    where: "Links in this source page’s content, navigation, or shared template.",
    steps: ["Open this source page and inspect its internal links. The current audit API reports the number of broken destinations, but does not expose their URLs; check each destination to identify the failing hrefs.", "Replace each href with the correct working URL, restore the intended destination, or remove the link if there is no useful replacement.", "If the same link appears across many pages, fix the shared navigation or template once and publish all affected pages."],
    verify: "Click the repaired links and run a new audit. Confirm the source page no longer reports broken destinations.", note: "This rule also flags destinations that were not crawled, including those beyond the page limit. Check the live URL before assuming it is broken.", source: google + "crawling-indexing/links-crawlable",
  },
  few_incoming_links: {
    where: "Other relevant pages on your site that should link to this destination.",
    steps: ["Identify relevant category, guide, or service pages where a link to this page would help the reader.", "Add descriptive anchor text in a normal <a href=\"…\"> link. Edit the source pages, not just the under-linked destination.", "Avoid adding unrelated links solely to increase the count. Make sure the new links are present in crawlable HTML."],
    verify: "Run a new audit and compare incoming links. The count covers the crawled sample, not necessarily your entire site.", source: google + "crawling-indexing/links-crawlable",
  },
};
export function issueLabel(type: string) {
  return type.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
export function capturedEvidence(type: string, page: PageDetail): string {
  if (type.includes("title")) return `Title: ${page.title || "Not set"}`;
  if (type.includes("meta_description")) return `Meta description: ${page.meta_description || "Not set"}`;
  if (type.includes("h1")) return `H1 headings: ${page.h1s.length ? page.h1s.map(h => h || "(empty)").join(" · ") : "None found"}`;
  if (type.startsWith("thin_content")) return `Captured word count: ${page.word_count}`;
  if (type === "noindex") return `Robots meta: ${page.robots_meta || "Not set"}`;
  if (type === "canonical_mismatch") return `Page: ${page.url}\nCanonical: ${page.canonical_url || "Not set"}`;
  if (type === "non_200") return `HTTP status: ${page.status_code ?? "No response"}\nFetch error: ${page.fetch_error || "None recorded"}`;
  if (type === "slow_response") return `Response time: ${page.response_time_ms ?? "Not recorded"}${page.response_time_ms !== null ? " ms" : ""}`;
  if (type === "redirect_chains") return `Redirect hops: ${page.redirect_count}`;
  if (type === "few_incoming_links") return `Incoming links in this crawl: ${page.incoming_internal_link_count}`;
  if (type === "missing_alt_text") return page.images.filter(i => !i.alt?.trim()).map(i => `${i.src} — ${i.alt === null ? "alt missing" : "empty alt"}`).join("\n") || "See the image inventory below.";
  return "See the recorded finding above for the evidence captured by this audit.";
}
