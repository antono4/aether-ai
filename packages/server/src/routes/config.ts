import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().optional(),
  model: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  voiceEnabled: z.boolean().optional(),
  memoryEnabled: z.boolean().optional(),
  defaultProvider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'local']).optional(),
});

const ProviderConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'local']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string(),
});

// In-memory config (replace with persistent storage)
let appConfig = {
  apiUrl: 'http://localhost:4000',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
  voiceEnabled: false,
  memoryEnabled: true,
  defaultProvider: 'openai' as const,
};

const providerConfigs = new Map<string, any>();

export async function configRoutes(app: FastifyInstance) {
  // Get app config
  app.get('/', async (request, reply) => {
    return reply.send({ config: appConfig });
  });

  // Update app config
  app.patch<{ Body: any }>(
    '/',
    async (request, reply) => {
      try {
        const updates = ConfigSchema.parse(request.body);
        appConfig = { ...appConfig, ...updates };
        
        return reply.send({ config: appConfig });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get provider configs
  app.get('/providers', async (request, reply) => {
    const configs = Array.from(providerConfigs.entries()).map(([key, value]) => ({
      provider: key,
      ...value,
    }));
    
    return reply.send({ providers: configs });
  });

  // Set provider config
  app.put<{ Params: { provider: string }; Body: any }>(
    '/providers/:provider',
    async (request, reply) => {
      try {
        const { provider } = request.params;
        const config = ProviderConfigSchema.parse({
          provider,
          ...request.body,
        });
        
        providerConfigs.set(provider, config);
        
        return reply.send({ provider: config });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Delete provider config
  app.delete<{ Params: { provider: string } }>(
    '/providers/:provider',
    async (request, reply) => {
      const { provider } = request.params;
      providerConfigs.delete(provider);
      
      return reply.status(204).send();
    }
  );

  // Validate API key for a provider
  app.post<{ Body: { provider: string; apiKey: string } }>(
    '/validate',
    async (request, reply) => {
      try {
        const { provider, apiKey } = request.body;
        
        // Create a test provider and validate
        const { createProvider } = await import('@aether/ai-core');
        const config = { provider, apiKey, model: 'test' };
        const p = createProvider(config);
        
        const valid = await p.validateConfig(config);
        
        return reply.send({ valid });
      } catch (error: any) {
        return reply.send({ valid: false, error: error.message });
      }
    }
  );
}