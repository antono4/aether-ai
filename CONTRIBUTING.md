# Contributing to Aether

Thank you for your interest in contributing to Aether!

## Code of Conduct

By participating, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10.10.0+
- Rust 1.75+ (for Tauri/desktop)
- Git

### Setup

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/YOUR_USERNAME/aether-ai.git
cd aether-ai

# Add upstream remote
git remote add upstream https://github.com/antono4/aether-ai.git

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## Development Workflow

### Branching

```
main          → Production-ready code
├── feat/*    → New features
├── fix/*     → Bug fixes
├── docs/*    → Documentation
├── refactor/* → Code refactoring
├── test/*    → Test additions
```

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new AI provider
fix: resolve memory leak
docs: update README
style: format code
refactor: simplify auth logic
test: add integration tests
chore: update dependencies
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a PR with a clear description

## Project Structure

```
aether/
├── apps/           # Applications
│   ├── desktop/    # Tauri desktop app
│   └── cli/        # CLI tool
├── packages/       # Shared packages
│   ├── ai-core/   # AI provider integration
│   ├── memory/     # Memory system
│   ├── server/     # API server
│   └── ...
├── .agents/        # Agent definitions
├── .aether/        # Configuration
└── docs/           # Documentation
```

## Packages

### TypeScript Packages

| Package | Description |
|---------|-------------|
| `@aether/ai-core` | AI provider abstraction |
| `@aether/memory` | Memory/context management |
| `@aether/server` | API server |
| `@aether/shared-types` | Shared TypeScript types |

### Rust Packages

| Package | Description |
|---------|-------------|
| `core` | Core functionality |
| `secure-store` | Encrypted storage |
| `scheduler` | Task scheduling |

## Testing

```bash
# Run all tests
pnpm test

# Run TypeScript tests
pnpm --filter @aether/ai-core test

# Run Rust tests
cargo test --workspace
```

## Style Guide

### TypeScript

- Use strict TypeScript
- Prefer `const` over `let`
- Use meaningful variable names
- Document public APIs with JSDoc

### Rust

- Run `cargo fmt` before committing
- Address all `clippy` warnings
- Use Result types for error handling

## Questions?

- Discord: [Join our server](https://discord.gg/aether)
- GitHub Discussions
- Email: hello@aether.ai