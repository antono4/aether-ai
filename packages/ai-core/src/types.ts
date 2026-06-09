import { z } from 'zod';

// Provider types
export const ProviderTypeSchema = z.enum(['openai', 'anthropic', 'google', 'ollama', 'local']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

// Model configuration
export const ModelConfigSchema = z.object({
  provider: ProviderTypeSchema,
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  maxTokens: z.number().min(1).max(200000).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).optional(),
  stopSequences: z.array(z.string()).optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// Chat message
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  name: z.string().optional(),
  toolCalls: z.array(z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
  toolCallId: z.string().optional(),
  toolOutput: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Request/Response types
export const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  maxTokens: z.number().optional(),
  stream: z.boolean().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  tools: z.array(z.object({
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any()),
    }),
  })).optional(),
  toolChoice: z.union([
    z.literal('auto'),
    z.literal('none'),
    z.object({
      type: z.literal('function'),
      function: z.object({ name: z.string() }),
    }),
  ]).optional(),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: ChatMessageSchema,
    finishReason: z.string(),
  })),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  created: z.number(),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

// Streaming chunk
export const ChatCompletionChunkSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    delta: z.object({
      role: z.string().optional(),
      content: z.string().optional(),
      toolCalls: z.array(z.object({
        id: z.string(),
        type: z.literal('function'),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      })).optional(),
    }),
    finishReason: z.string().nullable(),
  })),
  created: z.number(),
});

export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>;

// Error types
export const AIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  provider: ProviderTypeSchema.optional(),
  statusCode: z.number().optional(),
});

export type AIError = z.infer<typeof AIErrorSchema>;

// Context for AI requests
export interface AIContext {
  conversationId: string;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  maxHistoryMessages?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallResult {
  toolCallId: string;
  output: string;
}