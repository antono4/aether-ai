# Aether Agent System

Aether uses a multi-agent system where specialized agents work together to accomplish complex tasks.

## Core Agents

### 🏗️ Architect Agent
- System design and architecture planning
- Technology stack decisions
- Code review and quality assurance

**Trigger Keywords:** `architect`, `design`, `architecture`, `system`

### 💻 Dev Agent  
- Full-stack development
- Code implementation
- Bug fixes and optimizations

**Trigger Keywords:** `code`, `implement`, `develop`, `build`, `fix`

### 🎨 Design Agent
- UI/UX design decisions
- Component styling
- Visual consistency

**Trigger Keywords:** `design`, `ui`, `ux`, `style`, `component`

### 🔍 Code Reviewer Agent
- Code quality analysis
- Security auditing
- Best practices enforcement

**Trigger Keywords:** `review`, `audit`, `quality`, `check`

### 🚀 Deploy Agent
- CI/CD pipeline management
- Deployment orchestration
- Infrastructure as code

**Trigger Keywords:** `deploy`, `release`, `publish`, `ship`

### 📊 Memory Keeper Agent
- Context and memory management
- Knowledge retrieval
- Information organization

**Trigger Keywords:** `remember`, `memory`, `context`, `recall`

### ✅ QA Agent
- Testing strategy
- Quality metrics
- Test coverage

**Trigger Keywords:** `test`, `qa`, `quality`, `coverage`

### 📋 Task Master Agent
- Project management
- Task delegation
- Progress tracking

**Trigger Keywords:** `task`, `manage`, `track`, `delegate`

## Agent Communication

Agents communicate via a shared context bus:
```
[User Input] → [Task Router] → [Specialist Agent] → [Result]
                   ↓
            [Memory Keeper] (for context)
```

## Using Agents

In your conversation, simply mention the agent type:
- "Architect, help me design a microservices architecture"
- "Dev, implement the user authentication system"
- "QA, review the code changes for this PR"

## Agent Skills

Each agent has specialized skills loaded from `.agents/skills/`:

- `code-execution` - Run code safely
- `web-search` - Search the web
- `file-operations` - Read/write files
- `git-operations` - Version control
- `terminal` - Execute shell commands