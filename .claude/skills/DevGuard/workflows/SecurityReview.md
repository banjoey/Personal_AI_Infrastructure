# SecurityReview Workflow

**Purpose:** Ensure security-sensitive code follows current best practices.

## Activation Triggers

This workflow activates BEFORE implementing:
- Authentication/authorization
- Password hashing/storage
- Session management
- Cryptographic operations
- Input validation/sanitization
- Database queries
- File uploads/handling
- API security (rate limiting, CORS)
- Secrets/credential handling

## Execution Steps

### Step 1: Identify Security Domain

| Question | Answer |
|----------|--------|
| What security-sensitive operation? | |
| What data is at risk? | |
| What's the threat model? | |
| What's the impact of failure? | |

### Step 2: Research OWASP Guidance

**MANDATORY: Check OWASP cheatsheets for your domain:**

| Domain | OWASP Resource |
|--------|----------------|
| Authentication | Authentication Cheatsheet |
| Password Storage | Password Storage Cheatsheet |
| Session Management | Session Management Cheatsheet |
| Input Validation | Input Validation Cheatsheet |
| SQL Injection | SQL Injection Prevention |
| XSS | XSS Prevention Cheatsheet |
| CSRF | CSRF Prevention Cheatsheet |
| Cryptography | Cryptographic Storage Cheatsheet |
| File Upload | File Upload Cheatsheet |
| API Security | REST Security Cheatsheet |

```
WebFetch: https://cheatsheetseries.owasp.org/
```

### Step 3: Verify Current Recommendations

**Security recommendations change. Verify for 2025:**

| Check | 2023 Guidance | Current (2025) | Changed? |
|-------|---------------|----------------|----------|
| Password hashing algorithm | | | |
| Work factor/iterations | | | |
| Key sizes | | | |
| Deprecated functions | | | |

Example searches:
```
Search: "bcrypt work factor 2025 recommendation"
Search: "password hashing best practice 2025"
Search: "JWT security recommendations 2025"
```

### Step 4: Library-Specific Security

**Check the security docs for libraries you're using:**

```
WebFetch: [library] security documentation
Search: "[library] security best practices"
Search: "[library] common vulnerabilities"
```

| Library | Security Feature | Enabled? | Notes |
|---------|------------------|----------|-------|
| | | | |

### Step 5: Check for Known Vulnerabilities

**Search for CVEs related to your implementation:**

```
Search: "[library] CVE"
Search: "[technique] vulnerability"
Search: "[algorithm] weakness"
```

| CVE | Description | Affected | Mitigation |
|-----|-------------|----------|------------|
| | | | |

### Step 6: Timing Attack Considerations

**For comparison operations (passwords, tokens, etc.):**

- Use constant-time comparison functions
- Don't leak information through timing
- Check library provides timing-safe methods

```javascript
// BAD - timing attack vulnerable
if (userToken === storedToken) { ... }

// GOOD - constant time
crypto.timingSafeEqual(Buffer.from(userToken), Buffer.from(storedToken))
```

### Step 7: Secrets Management

**If handling secrets:**

| Check | Status |
|-------|--------|
| Secrets in environment variables (not code)? | |
| Using secrets manager (Infisical, etc.)? | |
| Secrets excluded from git? | |
| Rotation strategy defined? | |

### Step 8: Security Checklist

**Domain-specific checklists:**

#### Authentication
```
[ ] Using proven library (not custom crypto)
[ ] Password hashing with bcrypt/argon2 (current work factor)
[ ] Timing-safe password comparison
[ ] Account lockout after failed attempts
[ ] Secure session management
[ ] MFA support considered
```

#### Database/SQL
```
[ ] Using parameterized queries (not string concat)
[ ] ORM configured securely
[ ] Least-privilege database user
[ ] Input validated before use
[ ] Sensitive data encrypted at rest
```

#### API
```
[ ] Rate limiting implemented
[ ] Authentication on all sensitive endpoints
[ ] Input validation on all parameters
[ ] CORS configured restrictively
[ ] Sensitive data not in URLs
[ ] Proper error messages (no info leakage)
```

#### File Handling
```
[ ] File type validation (not just extension)
[ ] File size limits
[ ] Stored outside web root
[ ] Randomized filenames
[ ] Virus scanning considered
```

### Step 9: Final Security Gate

**ALL must be true before proceeding:**

```
[ ] Checked OWASP guidance for this domain
[ ] Verified current (2025) recommendations
[ ] Using established libraries (not custom crypto)
[ ] Reviewed library's security documentation
[ ] No known vulnerabilities in approach
[ ] Secrets handled securely
[ ] Code doesn't leak sensitive info
```

**If any box is unchecked: DO NOT PROCEED.**

## Output

Security approach documented and verified against current best practices.
Any deviations from OWASP guidance justified and documented.
