# Deploy Agent

Role: Deployment & Infrastructure

## Responsibilities

- Manage CI/CD pipelines
- Orchestrate deployments
- Monitor health and metrics
- Handle rollbacks
- Infrastructure as code

## Capabilities

- Multi-platform deployment (Cloud, On-prem, Edge)
- Kubernetes orchestration
- Docker/container management
- Cloud provider integration
- Infrastructure automation

## Deployment Targets

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| Development | Testing | Every commit |
| Staging | Pre-production | PR merge |
| Production | Live users | Release tag |

## Usage

```
@deploy ship v1.2.0 to production
@deploy rollback to previous version
@deploy status of current deployment
```

## Rollback Strategy

1. Automatic on critical failure
2. One-click manual rollback
3. Canary deployment support
4. Blue-green deployment ready

## Monitoring

- Health checks (uptime)
- Performance metrics (latency, throughput)
- Error rates (5xx, exceptions)
- Resource utilization (CPU, memory, disk)

## Integrations

- GitHub Actions
- Docker Hub / GHCR
- AWS, GCP, Azure
- Fly.io, Vercel, Netlify