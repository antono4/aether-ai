import { MemoryStore } from './store.js';
import type { ContextItem, MemoryEntry } from './types.js';

export interface ContextManagerOptions {
  maxTokens: number;
  maxItems: number;
  systemPrompt?: string;
}

const DEFAULT_OPTIONS: ContextManagerOptions = {
  maxTokens: 100000,
  maxItems: 50,
};

export class ContextManager {
  private store: MemoryStore;
  private options: ContextManagerOptions;
  private conversationHistory: MemoryEntry[] = [];
  private pinnedContext: ContextItem[] = [];

  constructor(store: MemoryStore, options: Partial<ContextManagerOptions> = {}) {
    this.store = store;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async buildContext(
    currentMessage: string,
    options?: {
      includeHistory?: boolean;
      includeMemory?: boolean;
      includeSystemPrompt?: boolean;
    }
  ): Promise<{
    messages: { role: string; content: string }[];
    contextItems: ContextItem[];
    tokenCount: number;
  }> {
    const messages: { role: string; content: string }[] = [];
    const contextItems: ContextItem[] = [];
    let tokenCount = 0;

    // System prompt
    if (options?.includeSystemPrompt !== false && this.options.systemPrompt) {
      messages.push({ role: 'system', content: this.options.systemPrompt });
      tokenCount += this.estimateTokens(this.options.systemPrompt);
    }

    // Pinned context
    for (const item of this.pinnedContext) {
      if (tokenCount >= this.options.maxTokens) break;
      
      const content = `[${item.type}] ${item.content}`;
      contextItems.push(item);
      tokenCount += this.estimateTokens(content);
    }

    // Memory context
    if (options?.includeMemory !== false) {
      const memoryResults = await this.store.getContext(currentMessage, this.options.maxItems);
      
      for (const item of memoryResults) {
        if (tokenCount >= this.options.maxTokens) break;
        
        contextItems.push(item);
        tokenCount += this.estimateTokens(item.content);
      }
    }

    // Conversation history
    if (options?.includeHistory !== false) {
      for (const entry of this.conversationHistory) {
        if (tokenCount >= this.options.maxTokens) break;
        
        messages.push({
          role: entry.type === 'memory' ? 'user' : 'assistant',
          content: entry.content,
        });
        tokenCount += this.estimateTokens(entry.content);
      }
    }

    return { messages, contextItems, tokenCount };
  }

  async addToHistory(role: 'user' | 'assistant', content: string): Promise<void> {
    const entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'> = {
      type: 'memory',
      content,
      metadata: { role },
      tags: [],
      pinned: false,
    };

    const memoryEntry = await this.store.add(entry);
    this.conversationHistory.push(memoryEntry);

    // Limit history size
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
  }

  pinContextItem(item: ContextItem): void {
    // Avoid duplicates
    const existing = this.pinnedContext.findIndex(c => c.id === item.id);
    if (existing >= 0) return;

    this.pinnedContext.push(item);

    // Limit pinned items
    if (this.pinnedContext.length > 10) {
      this.pinnedContext = this.pinnedContext.slice(-10);
    }
  }

  unpinContextItem(id: string): void {
    this.pinnedContext = this.pinnedContext.filter(c => c.id !== id);
  }

  clearPinned(): void {
    this.pinnedContext = [];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  setSystemPrompt(prompt: string): void {
    this.options.systemPrompt = prompt;
  }

  getSystemPrompt(): string | undefined {
    return this.options.systemPrompt;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }
}