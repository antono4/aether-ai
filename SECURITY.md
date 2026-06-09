# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Aether, please follow these steps:

1. **Do NOT** open a public issue on GitHub
2. Email security@aether.ai with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

3. We will respond within 48 hours
4. Once confirmed, we will:
   - Create a private fix
   - Coordinate disclosure
   - Credit the reporter (if desired)

## Security Features

### Data Encryption
- All API keys encrypted at rest using AES-256
- TLS 1.3 for all network communication
- Local storage uses secure keychain/credential manager

### Privacy
- No telemetry or tracking by default
- All processing can be done locally
- User-controlled data retention

### Code Security
- Regular dependency audits (`npm audit`)
- Rust code follows secure coding practices
- No shell injection vulnerabilities
- Sandboxed code execution

## Security Best Practices for Users

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env` files (already in `.gitignore`)
3. **Updates**: Keep Aether updated for latest security patches
4. **Permissions**: Review requested permissions before granting

## Security Updates

Security updates are released as patch versions and announced via:
- GitHub Security Advisories
- Discord announcements channel
- Release notes