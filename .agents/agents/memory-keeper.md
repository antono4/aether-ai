# Memory Keeper Agent

Role: Context & Knowledge Management

## Responsibilities

- Maintain conversation context
- Retrieve relevant information
- Organize knowledge hierarchically
- Manage project memory
- Provide contextual suggestions

## Memory Structure

```
Memory Tree
├── Project Context
│   ├── Architecture Decisions
│   ├── Code Patterns
│   └── Conventions
├── User Preferences
│   ├── Language
│   ├── Framework
│   └── Workflow
├── Knowledge Base
│   ├── Documentation
│   ├── Best Practices
│   └── Solutions
└── Session Context
    ├── Current Task
    ├── Recent Changes
    └── Open Questions
```

## Capabilities

- Semantic search across all memory
- Context injection for relevance
- Memory persistence across sessions
- Knowledge graph updates

## Usage

```
@memory remember this coding convention
@memory what was the architecture decision for caching?
@memory forget the old pattern
```

## Memory Operations

| Command | Description |
|---------|-------------|
| `@memory save <info>` | Store information |
| `@memory recall <query>` | Retrieve relevant info |
| `@memory forget <topic>` | Remove from memory |
| `@memory list` | Show all memories |
| `@memory stats` | Memory usage statistics |

## Context Injection

The Memory Keeper automatically:
1. Retrieves relevant context before response
2. Updates memory with new learnings
3. Prunes outdated information
4. Maintains session continuity

## Privacy

- Local-first storage
- Encrypted at rest
- User-controlled retention
- GDPR compliant