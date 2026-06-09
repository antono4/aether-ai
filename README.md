# Aether AI

<p align="center">
  <img src="https://img.shields.io/badge/Status-Early%20Beta-orange" alt="Early Beta" />
  <a href="https://github.com/antono4/aether-ai/releases/latest"><img src="https://img.shields.io/github/v/release/antono4/aether-ai?label=Latest" alt="Latest Release" /></a>
  <a href="https://github.com/antono4/aether-ai/stargazers"><img src="https://img.shields.io/github/stars/antono4/aether-ai?style=flat" alt="GitHub Stars" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/antono4/aether-ai" alt="License" /></a>
</p>

<p align="center">
 <strong>Aether is your Personal AI super intelligence: local memory, managed services where needed, simple and powerful.</strong>
</p>

<p align="center">
  <a href="https://github.com/antono4/aether-ai">GitHub</a> •
  <a href="https://discord.gg/aether">Discord</a> •
  <a href="https://x.com/intent/follow?screen_name=aether_ai">X/Twitter</a>
</p>

---

## ✨ Features

### 🤖 Multi-Provider AI
- **OpenAI** - GPT-4o, GPT-4, GPT-3.5
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google** - Gemini 2.0, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Ollama** - Local LLM support (Llama 3, Mistral, CodeLlama)

### 🧠 Memory System
- **Local-first** - Your data stays on your machine
- **Memory Tree** - Hierarchical knowledge organization
- **Semantic Search** - Find information instantly
- **Context Aware** - Remembers your preferences and past conversations

### 👥 Multi-Agent System
- **Architect** - System design and architecture
- **Dev Agent** - Full-stack development
- **QA Agent** - Testing and quality assurance
- **Memory Keeper** - Knowledge management
- **Deploy Agent** - CI/CD and deployment
- **PR Manager** - Pull request coordination

### 🔧 Tools & Integrations
- **Web Search** - Current information from the web
- **File Operations** - Read, write, and edit files
- **Git Operations** - Version control workflows
- **Code Execution** - Run code safely in sandbox
- **MCP Support** - Model Context Protocol integrations

### 📦 Applications
- **Desktop App** - Native Tauri application
- **CLI Tool** - Command-line interface
- **API Server** - Fastify-based REST API
- **Mobile Ready** - React Native companion (coming soon)

## 🚀 Quick Start

### Install

```bash
# Clone the repository
git clone https://github.com/antono4/aether-ai.git
cd aether-ai

# Install dependencies
pnpm install

# Start the API server
pnpm dev:server

# Start the desktop app (new terminal)
pnpm dev
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up

# Access the app at http://localhost:4000
```

### npm Packages

```bash
# Install globally
npm install -g @aether/cli

# Or use npx
npx @aether/cli
```

## 📁 Project Structure

```
aether/
├── apps/
│   ├── desktop/           # Tauri Desktop App
│   │   ├── src/          # Frontend (TypeScript)
│   │   └── src-tauri/    # Backend (Rust)
│   └── cli/               # Command-line interface
├── packages/
│   ├── ai-core/          # AI provider integration
│   ├── memory/           # Memory system
│   ├── server/           # API server
│   ├── shared-types/     # Shared types
│   └── ...
├── .aether/              # Configuration
├── .agents/              # Agent definitions
└── docs/                 # Documentation
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Server
PORT=4000
NODE_ENV=development

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/aether

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

Or configure via the desktop app settings panel.

## 🎯 Usage

### Desktop App

1. Launch the app
2. Select your AI provider
3. Enter your API key (or use Ollama for local)
4. Start chatting!

### CLI

```bash
# Start interactive chat
aether chat

# Ask a question
aether ask "What is TypeScript?"

# Run a file
aether run script.ts

# Search the web
aether search "latest AI news"
```

### API

```bash
# Create conversation
curl -X POST http://localhost:4000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}'

# Send message
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "message": "Hello!"}'
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Lint Rust code
pnpm lint:rs
```

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [OpenHuman](https://github.com/tinyhumansai/openhuman)
- Built with [Tauri](https://tauri.app/), [Fastify](https://fastify.dev/), [TypeScript](https://www.typescriptlang.org/)
- AI providers: [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google](https://deepmind.google/)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/antono4">@antono4</a>
</p>
