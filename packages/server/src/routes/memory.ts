import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const MemoryEntrySchema = z.object({
  type: z.enum(['memory', 'document', 'code', 'url']),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const SearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(100).default(10),
  type: z.enum(['memory', 'document', 'code', 'url']).optional(),
});

// In-memory memory store (replace with vector DB in production)
interface MemoryEntry {
  id: string;
  type: 'memory' | 'document' | 'code' | 'url';
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
  accessCount: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Simple keyword-based search (replace with vector search in production)
function searchMemory(query: string, limit: number, type?: string): MemoryEntry[] {
  const queryLower = query.toLowerCase();
  
  const results = Array.from(memoryStore.values())
    .filter(entry => {
      if (type && entry.type !== type) return false;
      return entry.content.toLowerCase().includes(queryLower) ||
             entry.metadata && JSON.stringify(entry.metadata).toLowerCase().includes(queryLower);
    })
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, limit);
  
  return results;
}

export async function memoryRoutes(app: FastifyInstance) {
  // List memory entries
  app.get('/', async (request, reply) => {
    const entries = Array.from(memoryStore.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return reply.send({ entries });
  });

  // Search memory
  app.post<{ Body: any }>(
    '/search',
    async (request, reply) => {
      try {
        const { query, limit, type } = SearchSchema.parse(request.body);
        
        const results = searchMemory(query, limit, type);
        
        // Update access counts
        for (const entry of results) {
          entry.accessCount++;
        }
        
        return reply.send({ results });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Add memory entry
  app.post<{ Body: any }>(
    '/',
    async (request, reply) => {
      try {
        const body = MemoryEntrySchema.parse(request.body);
        
        const entry: MemoryEntry = {
          id: crypto.randomUUID(),
          type: body.type,
          content: body.content,
          metadata: body.metadata || {},
          createdAt: Date.now(),
          accessCount: 0,
        };
        
        memoryStore.set(entry.id, entry);
        
        return reply.status(201).send({ entry });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get single memory entry
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const entry = memoryStore.get(id);
      
      if (!entry) {
        return reply.status(404).send({ error: 'Memory entry not found' });
      }
      
      entry.accessCount++;
      
      return reply.send({ entry });
    }
  );

  // Update memory entry
  app.patch<{ Params: { id: string }; Body: { content?: string; metadata?: Record<string, unknown> } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { content, metadata } = request.body;
      
      const entry = memoryStore.get(id);
      if (!entry) {
        return reply.status(404).send({ error: 'Memory entry not found' });
      }
      
      if (content) entry.content = content;
      if (metadata) entry.metadata = { ...entry.metadata, ...metadata };
      
      return reply.send({ entry });
    }
  );

  // Delete memory entry
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      
      if (!memoryStore.has(id)) {
        return reply.status(404).send({ error: 'Memory entry not found' });
      }
      
      memoryStore.delete(id);
      
      return reply.status(204).send();
    }
  );

  // Clear all memory
  app.delete('/', async (request, reply) => {
    memoryStore.clear();
    return reply.status(204).send();
  });
}