# Web Search Skill

Search the web for current information.

## Capabilities

- **Web Search** - Full-text search via Tavily
- **URL Extraction** - Parse content from URLs
- **Research** - Comprehensive topic research
- **Image Search** - Find relevant images

## Usage

```
Search for "latest TypeScript features 2024"
Extract content from https://example.com/docs
Research "best practices for React performance"
```

## Search Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | string | required | Search query |
| max_results | number | 10 | Max results |
| search_depth | string | "basic" | "basic", "advanced" |
| include_raw_content | boolean | false | Full HTML |

## Output Format

```json
{
  "results": [
    {
      "url": "https://...",
      "title": "Result Title",
      "description": "Snippet...",
      "score": 0.95,
      "content": "Full content...",
      "published": "2024-01-15"
    }
  ],
  "totalResults": 42,
  "queryTime": 125
}
```

## Best Practices

1. **Specific queries** - "React useEffect cleanup" vs "React"
2. **Filter domains** - `include_domains: ["github.com"]`
3. **Date ranges** - For recent info `start_date: "2024-01-01"`
4. **Language** - `country: "US"` for English results

## Rate Limits

- 20 requests/minute
- 1000 requests/day
- Burst: 5 concurrent requests

## Privacy

- No tracking
- Encrypted queries
- Local caching