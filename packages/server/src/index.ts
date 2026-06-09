import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { config } from 'dotenv';
import { conversationRoutes } from './routes/conversations.js';
import { chatRoutes } from './routes/chat.js';
import { configRoutes } from './routes/config.js';
import { providerRoutes } from './routes/providers.js';
import { memoryRoutes } from './routes/memory.js';

// Load environment
config();

const PORT = parseInt(process.env.PORT || '4000');
const HOST = process.env.HOST || 'localhost';

async function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  });

  await app.register(websocket);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: Date.now() }));

  // API routes
  await app.register(conversationRoutes, { prefix: '/api/conversations' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(configRoutes, { prefix: '/api/config' });
  await app.register(providerRoutes, { prefix: '/api/providers' });
  await app.register(memoryRoutes, { prefix: '/api/memory' });

  // SSE endpoint for streaming
  app.get('/api/stream/:conversationId', { websocket: true }, (socket) => {
    socket.on('message', (message) => {
      // Handle streaming messages
      socket.send(JSON.stringify({ type: 'connected' }));
    });
  });

  return app;
}

async function start() {
  try {
    const app = await buildServer();
    
    await app.listen({ port: PORT, host: HOST });
    
    console.log(`
✨ Aether Server running at:
  http://${HOST}:${PORT}

  Health: http://${HOST}:${PORT}/health
  API:    http://${HOST}:${PORT}/api
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();