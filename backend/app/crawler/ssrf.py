"""SSRF protection: DNS-resolve a hostname and reject anything that resolves
to a non-public IP range.

Residual gap (documented, not yet implemented): there is a small TOCTOU
window between this DNS check and the actual outbound connection — an
attacker-controlled DNS record could resolve to a public IP here and then be
"rebound" to a private IP by the time httpx connects (DNS rebinding). The
correct next hardening step is pinning the validated IP for the actual
socket connection via a custom httpx transport, so the connection reuses the
exact address we checked rather than re-resolving. Not implemented yet — see
README security section.
"""

import ipaddress
import socket

IPAddress = ipaddress.IPv4Address | ipaddress.IPv6Address

# Explicit, documented blocklist (in addition to the general is_private /
# is_loopback / is_link_local / is_reserved / is_multicast / is_unspecified
# checks below, which act as a redundant safety net).
BLOCKED_NETWORKS: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = [
    ipaddress.ip_network("0.0.0.0/8"),  # "this network"
    ipaddress.ip_network("127.0.0.0/8"),  # loopback
    ipaddress.ip_network("169.254.0.0/16"),  # link-local (cloud metadata lives here)
    ipaddress.ip_network("10.0.0.0/8"),  # RFC1918 private
    ipaddress.ip_network("172.16.0.0/12"),  # RFC1918 private
    ipaddress.ip_network("192.168.0.0/16"),  # RFC1918 private
    ipaddress.ip_network("100.64.0.0/10"),  # CGNAT
    ipaddress.ip_network("192.0.2.0/24"),  # TEST-NET-1 (documentation)
    ipaddress.ip_network("198.51.100.0/24"),  # TEST-NET-2 (documentation)
    ipaddress.ip_network("203.0.113.0/24"),  # TEST-NET-3 (documentation)
    ipaddress.ip_network("224.0.0.0/4"),  # multicast
    ipaddress.ip_network("::1/128"),  # loopback (IPv6)
    ipaddress.ip_network("::/128"),  # unspecified (IPv6)
    ipaddress.ip_network("fe80::/10"),  # link-local (IPv6)
    ipaddress.ip_network("fc00::/7"),  # unique local / private (IPv6)
    ipaddress.ip_network("2001:db8::/32"),  # documentation (IPv6)
]


class SSRFViolationError(Exception):
    """Raised when a hostname resolves to a disallowed (non-public) IP."""


class DNSResolutionError(Exception):
    """Raised when a hostname cannot be resolved at all."""


def is_ip_blocked(ip: IPAddress) -> bool:
    if ip.is_loopback or ip.is_link_local or ip.is_private or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
        return True
    return any(ip in network for network in BLOCKED_NETWORKS)


def resolve_hostname(hostname: str) -> list[IPAddress]:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise DNSResolutionError(f"Could not resolve host: {hostname}") from exc

    ips: set[IPAddress] = set()
    for _family, _type, _proto, _canonname, sockaddr in infos:
        ips.add(ipaddress.ip_address(sockaddr[0]))

    if not ips:
        raise DNSResolutionError(f"Could not resolve host: {hostname}")

    return list(ips)


def assert_hostname_is_safe(hostname: str) -> list[IPAddress]:
    """Resolve hostname and raise SSRFViolationError if any resolved IP is blocked.

    Returns the resolved IPs on success (every resolved IP must be public).
    """
    ips = resolve_hostname(hostname)
    for ip in ips:
        if is_ip_blocked(ip):
            raise SSRFViolationError(f"Resolved IP {ip} for host '{hostname}' is not allowed")
    return ips
