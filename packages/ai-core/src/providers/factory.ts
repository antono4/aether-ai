import type { ModelConfig, ProviderType } from '../types.js';
import type { AIProvider } from '../provider.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GoogleProvider } from './google.js';
import { OllamaProvider } from './ollama.js';

type ProviderClass = new () => AIProvider;

const PROVIDERS: Record<ProviderType, ProviderClass> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  ollama: OllamaProvider,
  local: OllamaProvider, // Local uses Ollama as fallback
};

export function createProvider(config: ModelConfig): AIProvider {
  const ProviderClass = PROVIDERS[config.provider];
  
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${config.provider}`);
  }

  const provider = new ProviderClass();
  return provider;
}

export function getAvailableProviders(): ProviderType[] {
  return Object.keys(PROVIDERS) as ProviderType[];
}

export function getProviderInfo(type: ProviderType): { name: string; description: string; needsApiKey: boolean } {
  const info: Record<ProviderType, { name: string; description: string; needsApiKey: boolean }> = {
    openai: {
      name: 'OpenAI',
      description: 'GPT-4, GPT-4o, GPT-3.5 models',
      needsApiKey: true,
    },
    anthropic: {
      name: 'Anthropic',
      description: 'Claude 3.5, Claude 3 models',
      needsApiKey: true,
    },
    google: {
      name: 'Google',
      description: 'Gemini Pro, Gemini Flash models',
      needsApiKey: true,
    },
    ollama: {
      name: 'Ollama',
      description: 'Local LLM via Ollama server',
      needsApiKey: false,
    },
    local: {
      name: 'Local',
      description: 'Direct local model access',
      needsApiKey: false,
    },
  };

  return info[type];
}