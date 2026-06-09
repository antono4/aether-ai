// Re-export all types
export * from './types.js';
export * from './provider.js';

// Re-export providers
export { createProvider, getAvailableProviders, getProviderInfo } from './providers/factory.js';
export { OpenAIProvider } from './providers/openai.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { GoogleProvider } from './providers/google.js';
export { OllamaProvider } from './providers/ollama.js';

// AI Client - High-level API
import { createProvider, getAvailableProviders, getProviderInfo } from './providers/factory.js';
import type { ModelConfig, ChatMessage, ChatCompletionResponse, ChatCompletionChunk } from './types.js';
import type { AIProvider } from './provider.js';

export class AIClient {
  private provider: AIProvider;
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    this.provider = createProvider(config);
  }

  async initialize(): Promise<void> {
    await this.provider.initialize(this.config);
  }

  async chat(messages: ChatMessage[], options?: { maxTokens?: number }): Promise<ChatCompletionResponse> {
    return this.provider.chat(messages, options);
  }

  async *streamChat(messages: ChatMessage[], options?: { maxTokens?: number }): AsyncGenerator<ChatCompletionChunk> {
    yield* this.provider.streamChat(messages, options);
  }

  async listModels(): Promise<string[]> {
    return this.provider.listModels();
  }

  async validateConfig(): Promise<boolean> {
    return this.provider.validateConfig(this.config);
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Builder for creating AI clients
export class AIClientBuilder {
  private config: Partial<ModelConfig> = {};
  private systemPrompt?: string;

  withProvider(provider: ModelConfig['provider']): this {
    this.config.provider = provider;
    return this;
  }

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  withApiKey(apiKey: string): this {
    this.config.apiKey = apiKey;
    return this;
  }

  withBaseUrl(baseUrl: string): this {
    this.config.baseUrl = baseUrl;
    return this;
  }

  withTemperature(temperature: number): this {
    this.config.temperature = temperature;
    return this;
  }

  withMaxTokens(maxTokens: number): this {
    this.config.maxTokens = maxTokens;
    return this;
  }

  withSystemPrompt(prompt: string): this {
    this.systemPrompt = prompt;
    return this;
  }

  build(): AIClient {
    if (!this.config.provider || !this.config.model) {
      throw new Error('Provider and model are required');
    }
    return new AIClient(this.config as ModelConfig);
  }
}

// Convenience function for quick chat
export async function quickChat(
  config: ModelConfig,
  message: string,
  systemPrompt?: string
): Promise<string> {
  const client = new AIClient(config);
  await client.initialize();

  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: message });

  const response = await client.chat(messages);
  return response.choices[0]?.message?.content || '';
}

// Export helpers
export { getAvailableProviders, getProviderInfo };
export type { ProviderType, ModelConfig, ChatMessage, AIProvider } from './types.js';
export type { AIProvider } from './provider.js';