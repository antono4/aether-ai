import type { ModelConfig, ChatMessage, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';
import type { AIProvider } from '../provider.js';

export class AnthropicProvider implements AIProvider {
  readonly type = 'anthropic' as const;
  readonly supportsStreaming = true;
  
  private config!: ModelConfig;
  private apiKey: string = '';
  private baseUrl: string = 'https://api.anthropic.com/v1';

  async initialize(config: ModelConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  async chat(messages: ChatMessage[], context?: { maxTokens?: number }): Promise<ChatCompletionResponse> {
    const { system, rest } = this.splitSystemMessage(messages);
    const anthropicMessages = this.convertToAnthropicFormat(rest);

    const response = await this.makeRequest('/messages', {
      model: this.config.model,
      messages: anthropicMessages,
      system,
      temperature: this.config.temperature,
      max_tokens: context?.maxTokens || Math.min(this.config.maxTokens, 4096),
    });

    const anthropicResponse = response as any;
    return {
      id: anthropicResponse.id,
      model: this.config.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: anthropicResponse.content[0].text,
        },
        finishReason: anthropicResponse.stop_reason,
      }],
      usage: {
        promptTokens: anthropicResponse.usage.input_tokens,
        completionTokens: anthropicResponse.usage.output_tokens,
        totalTokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens,
      },
      created: Date.now(),
    };
  }

  async *streamChat(messages: ChatMessage[], context?: { maxTokens?: number }): AsyncGenerator<ChatCompletionChunk> {
    const { system, rest } = this.splitSystemMessage(messages);
    const anthropicMessages = this.convertToAnthropicFormat(rest);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config.model,
        messages: anthropicMessages,
        system,
        temperature: this.config.temperature,
        max_tokens: context?.maxTokens || Math.min(this.config.maxTokens, 4096),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
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
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta') {
              yield {
                id: 'streaming',
                model: this.config.model,
                choices: [{
                  index: 0,
                  delta: { content: event.delta.text },
                  finishReason: null,
                }],
                created: Date.now(),
              };
            }
          } catch {
            // Skip
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet',
      'claude-3-opus',
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3-haiku-20240307',
    ];
  }

  async validateConfig(config: ModelConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return response.ok || response.status === 400; // 400 is ok - just means model works
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }

  private splitSystemMessage(messages: ChatMessage[]): { system?: string; rest: ChatMessage[] } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const rest = messages.filter(m => m.role !== 'system');
    return {
      system: systemMessages.map(m => m.content).join('\n'),
      rest,
    };
  }

  private convertToAnthropicFormat(messages: ChatMessage[]): { role: string; content: string }[] {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
  }

  private async makeRequest(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}