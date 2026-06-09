import type { ModelConfig, ChatMessage, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';
import type { AIProvider } from '../provider.js';

export class OllamaProvider implements AIProvider {
  readonly type = 'ollama' as const;
  readonly supportsStreaming = true;
  
  private config!: ModelConfig;
  private baseUrl: string = 'http://localhost:11434';

  async initialize(config: ModelConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async chat(messages: ChatMessage[], context?: { maxTokens?: number }): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: context?.maxTokens || this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return {
      id: crypto.randomUUID(),
      model: this.config.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.message?.content || '',
        },
        finishReason: data.done ? 'stop' : 'length',
      }],
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      created: Date.now(),
    };
  }

  async *streamChat(messages: ChatMessage[], context?: { maxTokens?: number }): AsyncGenerator<ChatCompletionChunk> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: context?.maxTokens || this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
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
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            yield {
              id: crypto.randomUUID(),
              model: this.config.model,
              choices: [{
                index: 0,
                delta: { content: data.message?.content || '' },
                finishReason: data.done ? 'stop' : null,
              }],
              created: Date.now(),
            };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  async validateConfig(config: ModelConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}