import type { ModelConfig, ChatMessage, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';
import type { AIProvider } from '../provider.js';
import { ProviderType } from '../types.js';

export class OpenAIProvider implements AIProvider {
  readonly type = 'openai' as const;
  readonly supportsStreaming = true;
  
  private config!: ModelConfig;
  private apiKey: string = '';
  private baseUrl: string = 'https://api.openai.com/v1';

  async initialize(config: ModelConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    
    if (!this.apiKey && !config.baseUrl?.includes('localhost')) {
      throw new Error('OpenAI API key is required');
    }
  }

  async chat(messages: ChatMessage[], context?: { maxTokens?: number }): Promise<ChatCompletionResponse> {
    const response = await this.makeRequest('/chat/completions', {
      model: this.config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: this.config.temperature,
      max_tokens: context?.maxTokens || this.config.maxTokens,
      stream: false,
      tools: this.config.provider === 'openai' ? undefined : undefined,
    });

    return response as ChatCompletionResponse;
  }

  async *streamChat(messages: ChatMessage[], context?: { maxTokens?: number }): AsyncGenerator<ChatCompletionChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name,
        })),
        temperature: this.config.temperature,
        max_tokens: context?.maxTokens || this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const chunk = JSON.parse(data) as ChatCompletionChunk;
            yield chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    return data.data
      .filter((m: any) => m.id.includes('gpt'))
      .map((m: any) => m.id);
  }

  async validateConfig(config: ModelConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  private async makeRequest(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}