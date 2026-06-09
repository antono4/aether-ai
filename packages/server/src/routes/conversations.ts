import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage (replace with database in production)
const conversations = new Map<string, Conversation>();

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export async function conversationRoutes(app: FastifyInstance) {
  // List all conversations
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const list = Array.from(conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    return reply.send({ conversations: list });
  });

  // Get single conversation
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const conv = conversations.get(id);
      
      if (!conv) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }
      
      return reply.send({ conversation: conv });
    }
  );

  // Create new conversation
  app.post<{ Body: { title?: string } }>(
    '/',
    async (request, reply) => {
      const { title } = request.body || {};
      const now = Date.now();
      
      const conv: Conversation = {
        id: uuidv4(),
        title: title || `New Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      
      conversations.set(conv.id, conv);
      
      return reply.status(201).send({ conversation: conv });
    }
  );

  // Update conversation title
  app.patch<{ Params: { id: string }; Body: { title: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { title } = request.body;
      
      const conv = conversations.get(id);
      if (!conv) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }
      
      conv.title = title;
      conv.updatedAt = Date.now();
      
      return reply.send({ conversation: conv });
    }
  );

  // Delete conversation
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      
      if (!conversations.has(id)) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }
      
      conversations.delete(id);
      
      return reply.status(204).send();
    }
  );

  // Clear all conversations
  app.delete('/', async (request, reply) => {
    conversations.clear();
    return reply.status(204).send();
  });
}