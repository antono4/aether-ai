import type { 
  ProviderType, 
  ModelConfig, 
  ChatMessage, 
  ChatCompletionResponse,
  ChatCompletionChunk,
  AIContext,
  ToolCallResult,
} from './types.js';

export interface AIProvider {
  readonly type: ProviderType;
  readonly supportsStreaming: boolean;
  
  initialize(config: ModelConfig): Promise<void>;
  chat(messages: ChatMessage[], context?: AIContext): Promise<ChatCompletionResponse>;
  streamChat(messages: ChatMessage[], context?: AIContext): AsyncGenerator<ChatCompletionChunk>;
  listModels(): Promise<string[]>;
  validateConfig(config: ModelConfig): Promise<boolean>;
}

export interface ProviderFactory {
  createProvider(config: ModelConfig): AIProvider;
  getType(): ProviderType;
}

export interface StreamingCallback {
  onChunk(chunk: ChatCompletionChunk): void;
  onComplete(response: ChatCompletionResponse): void;
  onError(error: Error): void;
}

// Tool execution interface
export interface ToolExecutor {
  executeTool(name: string, arguments: Record<string, unknown>): Promise<ToolCallResult>;
  registerTool(name: string, handler: ToolHandler): void;
}

export interface ToolHandler {
  (args: Record<string, unknown>): Promise<string>;
}

// Token counting utilities
export interface TokenCounter {
  countMessages(messages: ChatMessage[]): number;
  countText(text: string): number;
  getContextWindow(model: string): number;
}

// Model metadata
export interface ModelInfo {
  id: string;
  provider: ProviderType;
  contextWindow: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
}

// Default models per provider
export const DEFAULT_MODELS: Record<ProviderType, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  google: 'gemini-2.0-flash-exp',
  ollama: 'llama3.2',
  local: 'llama3.2',
};

// Context windows per model
export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-3-haiku': 200000,
  'gemini-2.0-flash-exp': 1000000,
  'gemini-1.5-pro': 2000000,
  'gemini-1.5-flash': 1000000,
};