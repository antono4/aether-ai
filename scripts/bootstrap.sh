#!/usr/bin/env bash
# ============================================================
# Aether Bootstrap Script
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "✨ Aether Bootstrap"
echo "=================="
echo ""

# Check prerequisites
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 not found. Please install $2"
    exit 1
  fi
  echo "✓ $1 found"
}

echo "Checking prerequisites..."
check_cmd node "Node.js >= 24.0.0"
check_cmd pnpm "pnpm >= 10.10.0"
check_cmd cargo "Rust >= 1.93.0"

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "Installing Rust toolchain..."
rustup default 1.93.0
rustup component add rustfmt clippy rust-analyzer

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  pnpm dev        - Start desktop app"
echo "  pnpm dev:cli    - Start CLI"
echo "  pnpm build      - Build all packages"
echo "  pnpm verify     - Run typecheck and tests"
echo ""