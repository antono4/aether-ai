import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAvailableProviders, getProviderInfo } from '@aether/ai-core';

export async function providerRoutes(app: FastifyInstance) {
  // List all available providers
  app.get('/', async (request, reply) => {
    const providers = getAvailableProviders().map(type => ({
      type,
      ...getProviderInfo(type),
    }));
    
    return reply.send({ providers });
  });

  // Get provider details
  app.get<{ Params: { type: string } }>(
    '/:type',
    async (request, reply) => {
      const { type } = request.params;
      const info = getProviderInfo(type as any);
      
      if (!info) {
        return reply.status(404).send({ error: 'Provider not found' });
      }
      
      // Default models per provider
      const models: Record<string, string[]> = {
        openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
        google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
        ollama: [], // Dynamic based on running server
        local: [],
      };
      
      return reply.send({
        type,
        ...info,
        models: models[type] || [],
      });
    }
  );

  // Test provider connection
  app.post<{ Body: { provider: string; apiKey?: string; baseUrl?: string; model?: string } }>(
    '/test',
    async (request, reply) => {
      try {
        const { provider, apiKey, baseUrl, model } = request.body;
        
        const { createProvider } = await import('@aether/ai-core');
        const config = { 
          provider: provider as any, 
          apiKey, 
          baseUrl,
          model: model || 'test',
        };
        
        const p = createProvider(config);
        await p.initialize(config);
        
        const valid = await p.validateConfig(config);
        const models = await p.listModels().catch(() => []);
        
        return reply.send({ 
          success: valid, 
          models: models.slice(0, 5),
          message: valid ? 'Connection successful' : 'Connection failed',
        });
      } catch (error: any) {
        return reply.status(500).send({ 
          success: false, 
          error: error.message,
        });
      }
    }
  );
}