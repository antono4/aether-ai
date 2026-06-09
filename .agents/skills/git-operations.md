# Git Operations Skill

Version control operations for repositories.

## Supported Platforms

- GitHub
- GitLab
- Bitbucket
- Azure DevOps

## Operations

### Repository

```bash
# Clone
git clone https://github.com/user/repo

# Fork
gh repo fork owner/repo

# Pull
git pull origin main
```

### Branching

```bash
# Create branch
git checkout -b feature/new-feature

# Switch
git switch main

# List
git branch -a
```

### Commit

```bash
# Stage
git add .

# Commit
git commit -m "feat: add new feature"

# Amend
git commit --amend
```

### Pull Requests

```bash
# Create PR
gh pr create --title "Feature" --body "Description"

# Review
gh pr review 123 --approve

# Merge
gh pr merge 123 --squash
```

## Usage

```
Create a new branch for the feature
Show me the diff for the last commit
Merge the PR after approval
```

## Best Practices

| Practice | Description |
|----------|-------------|
| Commit messages | Conventional commits |
| Branch naming | `type/description` |
| Review | 1+ approvals |
| Squash | Clean history |

## Safety

- Protected branches require PRs
- No force push to main
- Signed commits preferred