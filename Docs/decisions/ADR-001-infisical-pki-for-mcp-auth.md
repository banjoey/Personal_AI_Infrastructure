# ADR-001: Use Infisical PKI for MCP Authentication

**Status:** accepted

**Date:** 2025-12-21

## Context

MCP servers (gitlab-mcp, cloudflare-mcp, infisical-mcp) are deployed on the k3s cluster and exposed via HTTP endpoints. Currently, these endpoints have no authentication - anyone on the home network can access them.

We need a solution that:
1. Authenticates requests to MCP servers
2. Doesn't require secrets stored unencrypted on disk (no `.env` files)
3. Works with the existing infrastructure (Infisical, Traefik, k3s)
4. Is machine-to-machine friendly (not user-interactive like OAuth)

## Decision

**We will use Infisical PKI to issue client certificates and require mTLS for all MCP endpoints.**

Architecture:
```
┌─────────────┐         mTLS          ┌─────────────┐
│   Laptop    │ ◄────────────────────► │   Traefik   │
│             │  client cert from      │   Ingress   │
│  (Keychain  │  Infisical PKI         │             │
│   stores    │                        │  (validates │
│   cert)     │                        │   client    │
│             │                        │   cert)     │
└─────────────┘                        └──────┬──────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                  ┌────────────┐       ┌────────────┐       ┌────────────┐
                  │ gitlab-mcp │       │cloudflare- │       │ infisical- │
                  │            │       │    mcp     │       │    mcp     │
                  └────────────┘       └────────────┘       └────────────┘
```

Components:
- **Infisical PKI:** Private CA (Root + Intermediate) for issuing certificates
- **Laptop client cert:** Issued by Infisical, stored in macOS Keychain
- **Traefik mTLS middleware:** Validates client certificate before forwarding to MCP pods
- **cert-manager + infisical-issuer:** (Optional) Auto-issue/renew certs for k8s workloads

## Consequences

### Positive
- **Strong authentication:** Only devices with valid certs can access MCP servers
- **No secrets on disk:** Certificate stored in encrypted macOS Keychain
- **Leverages existing infra:** Uses Infisical already running on k3s
- **Machine-to-machine friendly:** No OAuth login flows, just certificate
- **Automatic renewal possible:** cert-manager can handle lifecycle
- **Audit trail:** Infisical tracks certificate issuance

### Negative
- **Setup complexity:** Need to configure Infisical CA, Traefik mTLS, cert deployment
- **Certificate lifecycle:** Must handle renewal before expiry
- **Laptop dependency:** If cert expires/is revoked, lose MCP access until renewed
- **Learning curve:** PKI concepts may be unfamiliar

### Neutral
- Joplin MCP (local) remains separate - uses local token, not affected by this decision

## Alternatives Considered

### OAuth2 / Authentik
- **Rejected:** OAuth is designed for user-interactive flows. MCP is machine-to-machine. Would require Claude Code to handle OAuth token refresh, which it doesn't support natively.

### API Keys / Bearer Tokens
- **Rejected:** Would require storing tokens somewhere - back to the `.env` on disk problem. Also less secure than mTLS.

### Tailscale
- **Considered but deferred:** Good option for simpler setups. Would add another network layer. Could revisit if mTLS proves too complex.

### VLAN Isolation
- **Rejected:** Only protects at network level. Compromised device on VLAN still has full access. Defense in depth says we need app-level auth too.

### No Authentication (Status Quo)
- **Rejected:** Unacceptable security risk. Anyone on home network could access MCP servers.

## Implementation Plan

1. **Infisical PKI Setup**
   - Create Root CA in Infisical
   - Create Intermediate CA for "home-infra"
   - Configure certificate templates

2. **Laptop Certificate**
   - Issue client certificate from Infisical
   - Install in macOS Keychain
   - Configure auto-renewal (if tooling exists)

3. **Traefik mTLS**
   - Create TLSOption with client CA
   - Create middleware requiring client cert
   - Apply to MCP ingress routes

4. **Testing**
   - Verify MCP access with cert
   - Verify rejection without cert
   - Test from different network locations

## References

- [Infisical PKI Documentation](https://infisical.com/docs/documentation/platform/pki/overview)
- [Infisical PKI Issuer for cert-manager](https://github.com/Infisical/infisical-issuer)
- [Traefik mTLS Documentation](https://doc.traefik.io/traefik/https/tls/#client-authentication-mtls)
