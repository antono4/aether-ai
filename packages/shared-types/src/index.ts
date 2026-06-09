// Message types
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Context types
export interface ContextEntry {
  id: string;
  type: 'memory' | 'document' | 'code' | 'url';
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
  accessCount: number;
}

// Tool types
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  toolId: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

// Task types
export interface Task {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  result?: unknown;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// Config types
export interface AppConfig {
  apiUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  voiceEnabled: boolean;
  memoryEnabled: boolean;
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
}

// Voice types
export interface VoiceConfig {
  engine: 'local' | 'cloud';
  voiceId: string;
  speed: number;
  pitch: number;
}

// Auth types
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Error types
export class AetherError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AetherError';
  }
}