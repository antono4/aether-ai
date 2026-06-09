import { z } from 'zod';

// Memory entry types
export const MemoryTypeSchema = z.enum(['memory', 'document', 'code', 'url', 'task']);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemoryEntrySchema = z.object({
  id: z.string(),
  type: MemoryTypeSchema,
  content: z.string(),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.number(),
  updatedAt: z.number(),
  accessCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

// Search options
export const SearchOptionsSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  type: MemoryTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.number().optional(),
    end: z.number().optional(),
  }).optional(),
  includePinned: z.boolean().default(true),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

// Search result
export interface SearchResult {
  entry: MemoryEntry;
  score: number;
  highlights: string[];
}

// Embedding config
export interface EmbeddingConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'none';
  model: string;
  dimension: number;
}

// Memory configuration
export interface MemoryConfig {
  maxEntries: number;
  maxContextTokens: number;
  autoMemoryEnabled: boolean;
  embedding: EmbeddingConfig;
}

// Default config
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxEntries: 10000,
  maxContextTokens: 100000,
  autoMemoryEnabled: true,
  embedding: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimension: 1536,
  },
};

// Context item for AI
export interface ContextItem {
  id: string;
  type: MemoryType;
  content: string;
  relevance: number;
  metadata: Record<string, unknown>;
}