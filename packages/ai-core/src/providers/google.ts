import type { ModelConfig, ChatMessage, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';
import type { AIProvider } from '../provider.js';

export class GoogleProvider implements AIProvider {
  readonly type = 'google' as const;
  readonly supportsStreaming = true;
  
  private config!: ModelConfig;
  private apiKey: string = '';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  async initialize(config: ModelConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      throw new Error('Google API key is required');
    }
  }

  async chat(messages: ChatMessage[], context?: { maxTokens?: number }): Promise<ChatCompletionResponse> {
    const contents = this.convertToGeminiFormat(messages);
    
    const response = await fetch(
      `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: context?.maxTokens || this.config.maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      id: crypto.randomUUID(),
      model: this.config.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: text },
        finishReason: 'stop',
      }],
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      created: Date.now(),
    };
  }

  async *streamChat(messages: ChatMessage[], context?: { maxTokens?: number }): AsyncGenerator<ChatCompletionChunk> {
    const contents = this.convertToGeminiFormat(messages);
    
    const response = await fetch(
      `${this.baseUrl}/models/${this.config.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: context?.maxTokens || this.config.maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} ${error}`);
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
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              yield {
                id: crypto.randomUUID(),
                model: this.config.model,
                choices: [{
                  index: 0,
                  delta: { content: data.text },
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
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];
  }

  async validateConfig(config: ModelConfig): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private convertToGeminiFormat(messages: ChatMessage[]): { role: string; parts: { text: string }[] }[] {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  }
}