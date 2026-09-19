import ipaddress
import socket

import pytest

from app.crawler.ssrf import (
    DNSResolutionError,
    SSRFViolationError,
    assert_hostname_is_safe,
    is_ip_blocked,
    resolve_hostname,
)


@pytest.mark.parametrize(
    "ip",
    [
        "127.0.0.1",  # loopback
        "127.53.0.1",  # loopback range
        "169.254.169.254",  # link-local — cloud metadata endpoint
        "10.0.0.1",  # RFC1918 private
        "172.16.0.1",  # RFC1918 private
        "172.31.255.255",  # RFC1918 private (top of range)
        "192.168.1.1",  # RFC1918 private
        "100.64.0.1",  # CGNAT
        "0.0.0.0",  # "this network"
        "224.0.0.1",  # multicast
        "192.0.2.1",  # documentation (TEST-NET-1)
        "::1",  # IPv6 loopback
        "fe80::1",  # IPv6 link-local
        "fc00::1",  # IPv6 unique local
        "2001:db8::1",  # IPv6 documentation
    ],
)
def test_blocks_non_public_ips(ip):
    assert is_ip_blocked(ipaddress.ip_address(ip)) is True


@pytest.mark.parametrize(
    "ip",
    [
        "8.8.8.8",
        "1.1.1.1",
        "93.184.216.34",
        "2606:4700:4700::1111",
    ],
)
def test_allows_public_ips(ip):
    assert is_ip_blocked(ipaddress.ip_address(ip)) is False


def test_resolve_hostname_returns_ips(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    ips = resolve_hostname("example.com")
    assert ips == [ipaddress.ip_address("93.184.216.34")]


def test_resolve_hostname_raises_on_failure(monkeypatch):
    def fake_getaddrinfo(host, port):
        raise socket.gaierror("Name or service not known")

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(DNSResolutionError):
        resolve_hostname("this-domain-does-not-exist.invalid")


def test_assert_hostname_is_safe_allows_public_resolution(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    ips = assert_hostname_is_safe("example.com")
    assert ips == [ipaddress.ip_address("93.184.216.34")]


def test_assert_hostname_is_safe_blocks_private_resolution(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(SSRFViolationError):
        assert_hostname_is_safe("internal.example.com")


def test_assert_hostname_is_safe_blocks_metadata_endpoint(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("169.254.169.254", 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(SSRFViolationError):
        assert_hostname_is_safe("attacker-controlled.example.com")


def test_assert_hostname_is_safe_blocks_if_any_resolved_ip_is_unsafe(monkeypatch):
    def fake_getaddrinfo(host, port):
        return [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", 0)),
        ]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    with pytest.raises(SSRFViolationError):
        assert_hostname_is_safe("multi-homed.example.com")
