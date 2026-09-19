"""Every numeric threshold the rules engine uses, in one place so the
reasoning behind each issue is auditable rather than buried in conditionals."""

TITLE_MIN_LENGTH = 30
TITLE_MAX_LENGTH = 60

META_DESCRIPTION_MIN_LENGTH = 70
META_DESCRIPTION_MAX_LENGTH = 160

# Two thresholds per the spec: pages below VERY_LOW are barely-there content;
# pages between VERY_LOW and LOW are thin but not empty.
THIN_CONTENT_VERY_LOW_WORDS = 100
THIN_CONTENT_LOW_WORDS = 300

FEW_INCOMING_LINKS_THRESHOLD = 2

SLOW_RESPONSE_MS = 2000

# A single redirect (1 hop) is normal; 2+ hops is a chain worth flattening.
REDIRECT_CHAIN_MIN_HOPS = 2
