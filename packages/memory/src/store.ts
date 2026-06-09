import type { MemoryEntry, SearchResult, SearchOptions, ContextItem } from './types.js';
import { DEFAULT_MEMORY_CONFIG, type MemoryConfig } from './types.js';

export class MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private config: MemoryConfig;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
  }

  async add(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<MemoryEntry> {
    const now = Date.now();
    const newEntry: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    };

    // Enforce max entries limit
    if (this.entries.size >= this.config.maxEntries) {
      await this.pruneOldest();
    }

    this.entries.set(newEntry.id, newEntry);
    return newEntry;
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.accessCount++;
      entry.updatedAt = Date.now();
    }
    return entry;
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    const updated: MemoryEntry = {
      ...entry,
      ...updates,
      id: entry.id,
      createdAt: entry.createdAt,
      updatedAt: Date.now(),
    };

    this.entries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const query = options.query.toLowerCase();
    
    let entries = Array.from(this.entries.values());

    // Filter by type
    if (options.type) {
      entries = entries.filter(e => e.type === options.type);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      entries = entries.filter(e => 
        options.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Filter by date range
    if (options.dateRange) {
      entries = entries.filter(e => {
        if (options.dateRange!.start && e.createdAt < options.dateRange!.start) return false;
        if (options.dateRange!.end && e.createdAt > options.dateRange!.end) return false;
        return true;
      });
    }

    // Filter pinned
    if (!options.includePinned) {
      entries = entries.filter(e => !e.pinned);
    }

    // Score and sort
    const results: SearchResult[] = entries.map(entry => {
      const score = this.calculateScore(entry, query);
      const highlights = this.extractHighlights(entry.content, query);
      
      return { entry, score, highlights };
    });

    // Filter by threshold and sort
    return results
      .filter(r => r.score >= options.threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);
  }

  async getContext(query: string, limit: number = 10): Promise<ContextItem[]> {
    const results = await this.search({
      query,
      limit,
      threshold: 0.5,
    });

    return results.map(r => ({
      id: r.entry.id,
      type: r.entry.type,
      content: r.entry.content,
      relevance: r.score,
      metadata: r.entry.metadata,
    }));
  }

  async list(options?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<MemoryEntry[]> {
    let entries = Array.from(this.entries.values());

    if (options?.type) {
      entries = entries.filter(e => e.type === options.type);
    }

    entries.sort((a, b) => b.updatedAt - a.updatedAt);

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    return entries.slice(offset, offset + limit);
  }

  async clear(type?: string): Promise<number> {
    let count = 0;
    
    if (type) {
      for (const [id, entry] of this.entries) {
        if (entry.type === type) {
          this.entries.delete(id);
          count++;
        }
      }
    } else {
      count = this.entries.size;
      this.entries.clear();
    }

    return count;
  }

  async pruneOldest(count: number = 100): Promise<number> {
    const entries = Array.from(this.entries.values())
      .filter(e => !e.pinned)
      .sort((a, b) => a.accessCount - b.accessCount)
      .slice(0, count);

    for (const entry of entries) {
      this.entries.delete(entry.id);
    }

    return entries.length;
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    pinned: number;
    avgAccessCount: number;
  } {
    const entries = Array.from(this.entries.values());
    const byType: Record<string, number> = {};
    let pinned = 0;
    let totalAccess = 0;

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      if (entry.pinned) pinned++;
      totalAccess += entry.accessCount;
    }

    return {
      total: entries.length,
      byType,
      pinned,
      avgAccessCount: entries.length > 0 ? totalAccess / entries.length : 0,
    };
  }

  private calculateScore(entry: MemoryEntry, query: string): number {
    let score = 0;

    // Content match
    const contentLower = entry.content.toLowerCase();
    const queryWords = query.split(/\s+/);
    
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 0.3;
        // Exact phrase match
        if (contentLower.includes(query)) {
          score += 0.4;
        }
      }
    }

    // Title match (if exists)
    if (entry.metadata?.title) {
      const titleLower = String(entry.metadata.title).toLowerCase();
      if (titleLower.includes(query)) {
        score += 0.3;
      }
    }

    // Tag match
    for (const tag of entry.tags) {
      if (tag.toLowerCase().includes(query)) {
        score += 0.2;
      }
    }

    // Recency boost
    const daysOld = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) score += 0.1;
    else if (daysOld < 30) score += 0.05;

    // Access count boost
    if (entry.accessCount > 10) score += 0.1;
    else if (entry.accessCount > 5) score += 0.05;

    // Pinned boost
    if (entry.pinned) score += 0.15;

    return Math.min(score, 1);
  }

  private extractHighlights(content: string, query: string): string[] {
    const highlights: string[] = [];
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Find sentences containing query terms
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.trim()) {
        const sentenceLower = sentence.toLowerCase();
        if (queryWords.some(w => sentenceLower.includes(w))) {
          highlights.push(sentence.trim().slice(0, 150) + (sentence.length > 150 ? '...' : ''));
        }
      }
    }

    return [...new Set(highlights)].slice(0, 3);
  }
}

// Query words for scoring
const queryWords: string[] = [];