# Code Execution Skill

Execute code safely in sandboxed environments.

## Supported Languages

| Language | Runtime | Use Case |
|----------|---------|----------|
| JavaScript/TypeScript | Node.js 24 | Web, CLI, APIs |
| Python | CPython 3.13 | Data, ML, Scripts |
| Rust | Cargo 1.93 | Systems, Performance |
| Bash | Zsh/Bash | Shell automation |

## Usage

```
Execute the following JavaScript:
console.log("Hello from Aether!");
```

## Safety Measures

1. **Sandboxing** - Isolated execution
2. **Timeout** - Max 30s per execution
3. **Resource Limits** - Memory/CPU caps
4. **Output Limits** - Max 1MB stdout

## Output Format

```json
{
  "success": true,
  "stdout": "Hello World",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 45,
  "memoryUsed": "12MB"
}
```

## Error Handling

| Error | Response |
|-------|----------|
| Timeout | "Execution timed out after 30s" |
| Memory | "Out of memory limit (512MB)" |
| Syntax | Show error with line number |
| Runtime | Show stack trace |

## Examples

### JavaScript
```javascript
const result = [1, 2, 3].map(x => x * 2);
console.log(result); // [2, 4, 6]
```

### Python
```python
result = [x * 2 for x in [1, 2, 3]]
print(result)  # [2, 4, 6]
```

### Bash
```bash
echo "Hello from shell!"
ls -la
```