import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createProvider, getAvailableProviders } from '@aether/ai-core';

// Validation schemas
const SendMessageSchema = z.object({
  content: z.string().min(1),
  conversationId: z.string().optional(),
});

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
  })),
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'local']).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional(),
});

// In-memory conversations (shared with conversations.ts in production)
const conversations = new Map<string, any>();
const providers = new Map<string, any>();

// Initialize providers based on environment
function getProviderConfig(provider: string, model?: string) {
  const configs: Record<string, any> = {
    openai: {
      provider: 'openai',
      model: model || 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      provider: 'anthropic',
      model: model || 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    google: {
      provider: 'google',
      model: model || 'gemini-2.0-flash-exp',
      apiKey: process.env.GOOGLE_API_KEY,
    },
    ollama: {
      provider: 'ollama',
      model: model || 'llama3.2',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    },
  };
  
  return configs[provider] || configs.openai;
}

export async function chatRoutes(app: FastifyInstance) {
  // Non-streaming chat
  app.post<{ Body: any }>(
    '/',
    async (request, reply) => {
      try {
        const body = ChatRequestSchema.parse(request.body);
        
        const config = getProviderConfig(body.provider || 'openai', body.model);
        const provider = createProvider(config);
        await provider.initialize(config);
        
        const response = await provider.chat(body.messages);
        
        return reply.send({
          id: response.id,
          model: response.model,
          choices: response.choices,
          usage: response.usage,
        });
      } catch (error: any) {
        app.log.error(error);
        return reply.status(500).send({ 
          error: error.message || 'Chat failed' 
        });
      }
    }
  );

  // Streaming chat (SSE)
  app.get<{ Params: { conversationId: string } }>(
    '/stream/:conversationId',
    async (request, reply) => {
      const { conversationId } = request.params;
      
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      
      // Store the reply stream for later use
      providers.set(conversationId, { reply, buffer: '' });
      
      return reply.raw;
    }
  );

  app.post<{ Body: any; Params: { conversationId: string } }>(
    '/stream/:conversationId',
    async (request, reply) => {
      const { conversationId } = request.params;
      
      try {
        const body = ChatRequestSchema.parse(request.body);
        
        const config = getProviderConfig(body.provider || 'openai', body.model);
        const provider = createProvider(config);
        await provider.initialize(config);
        
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        
        const sendEvent = (data: any) => {
          reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        
        // Stream the response
        for await (const chunk of provider.streamChat(body.messages)) {
          sendEvent(chunk);
        }
        
        sendEvent({ type: 'done' });
        reply.raw.end();
        
        return reply;
      } catch (error: any) {
        app.log.error(error);
        sendEvent({ type: 'error', error: error.message });
        reply.raw.end();
        return reply;
      }
    }
  );

  // List available models
  app.get('/models', async (request, reply) => {
    const models: Record<string, string[]> = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
      google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      ollama: [], // Will be fetched from running Ollama server
    };
    
    return reply.send({ models });
  });
}