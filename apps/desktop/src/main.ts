import './styles.css';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface AppConfig {
  apiUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  voiceEnabled: boolean;
  memoryEnabled: boolean;
  defaultProvider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'local';
}

interface Provider {
  type: string;
  name: string;
  description: string;
  needsApiKey: boolean;
}

// State
let conversations: Conversation[] = [];
let currentConversation: Conversation | null = null;
let config: AppConfig = {
  apiUrl: 'http://localhost:4000',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
  voiceEnabled: false,
  memoryEnabled: true,
  defaultProvider: 'openai',
};
let isStreaming = false;
let settingsOpen = false;

// API helpers
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

// UI Rendering
function render(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="aether-app">
      ${renderHeader()}
      <div class="aether-main">
        ${renderSidebar()}
        ${renderChatArea()}
      </div>
      ${settingsOpen ? renderSettingsPanel() : ''}
      <div class="toast-container" id="toasts"></div>
    </div>
  `;
  
  attachEventListeners();
}

function renderHeader(): string {
  return `
    <header class="aether-header">
      <div class="aether-logo">
        <div class="aether-logo-icon">✨</div>
        <span class="aether-logo-text">Aether</span>
      </div>
      <div class="aether-header-actions">
        <button class="btn btn-primary" id="new-chat-btn">
          <span>+</span> New Chat
        </button>
        <button class="btn btn-icon btn-ghost" id="settings-btn" title="Settings">
          ⚙️
        </button>
      </div>
    </header>
  `;
}

function renderSidebar(): string {
  return `
    <aside class="aether-sidebar">
      <div class="sidebar-header">
        <h3>Conversations</h3>
      </div>
      <div class="conversation-list">
        ${conversations.length === 0 
          ? '<div class="empty-state">No conversations yet</div>'
          : conversations.map(conv => `
            <div class="conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}" data-id="${conv.id}">
              <div class="conversation-icon">💬</div>
              <div class="conversation-info">
                <div class="conversation-title">${escapeHtml(conv.title)}</div>
                <div class="conversation-preview">${escapeHtml(conv.messages[conv.messages.length - 1]?.content?.slice(0, 50) || 'Empty')}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
    </aside>
  `;
}

function renderChatArea(): string {
  return `
    <section class="aether-chat">
      ${currentConversation 
        ? renderMessages()
        : renderWelcome()
      }
      ${renderInputArea()}
    </section>
  `;
}

function renderMessages(): string {
  return `
    <div class="chat-messages" id="messages">
      ${currentConversation!.messages.map(msg => `
        <div class="message ${msg.role}">
          <div class="message-avatar">${msg.role === 'user' ? '👤' : '✨'}</div>
          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text">${formatMessage(msg.content)}</div>
            </div>
          </div>
        </div>
      `).join('')}
      ${isStreaming ? `
        <div class="message assistant">
          <div class="message-avatar">✨</div>
          <div class="message-content">
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderWelcome(): string {
  return `
    <div class="chat-messages">
      <div class="chat-welcome">
        <div class="welcome-icon">✨</div>
        <h1 class="welcome-title">Welcome to Aether</h1>
        <p class="welcome-subtitle">Your personal AI assistant. Ask me anything or start a new conversation.</p>
        <div class="welcome-suggestions">
          <div class="suggestion-chip" data-prompt="Explain quantum computing in simple terms">Quantum computing</div>
          <div class="suggestion-chip" data-prompt="Write a Python function to sort a list">Write code</div>
          <div class="suggestion-chip" data-prompt="Help me plan a trip to Japan">Plan a trip</div>
          <div class="suggestion-chip" data-prompt="Summarize the latest news in AI">AI news</div>
        </div>
      </div>
    </div>
  `;
}

function renderInputArea(): string {
  return `
    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <textarea 
          class="chat-input" 
          id="message-input" 
          placeholder="Ask Aether anything..."
          rows="1"
        ></textarea>
        <div class="chat-actions">
          <button class="send-button" id="send-btn" ${isStreaming ? 'disabled' : ''}>
            ${isStreaming ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsPanel(): string {
  return `
    <div class="settings-overlay" id="settings-overlay"></div>
    <div class="settings-panel">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="btn btn-icon btn-ghost" id="close-settings">✕</button>
      </div>
      <div class="settings-content">
        <div class="settings-section">
          <h3 class="settings-section-title">AI Provider</h3>
          <div class="provider-grid">
            <div class="provider-card ${config.defaultProvider === 'openai' ? 'selected' : ''}" data-provider="openai">
              <div class="provider-card-header">
                <div class="provider-icon">🤖</div>
                <div class="provider-name">OpenAI</div>
              </div>
              <div class="provider-desc">GPT-4, GPT-4o, GPT-3.5</div>
            </div>
            <div class="provider-card ${config.defaultProvider === 'anthropic' ? 'selected' : ''}" data-provider="anthropic">
              <div class="provider-card-header">
                <div class="provider-icon">🧠</div>
                <div class="provider-name">Anthropic</div>
              </div>
              <div class="provider-desc">Claude 3.5, Claude 3</div>
            </div>
            <div class="provider-card ${config.defaultProvider === 'google' ? 'selected' : ''}" data-provider="google">
              <div class="provider-card-header">
                <div class="provider-icon">🔮</div>
                <div class="provider-name">Google</div>
              </div>
              <div class="provider-desc">Gemini Pro, Gemini Flash</div>
            </div>
            <div class="provider-card ${config.defaultProvider === 'ollama' ? 'selected' : ''}" data-provider="ollama">
              <div class="provider-card-header">
                <div class="provider-icon">💻</div>
                <div class="provider-name">Ollama</div>
              </div>
              <div class="provider-desc">Local LLM via Ollama</div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Model</h3>
          <div class="settings-option">
            <label class="settings-label">Model Name</label>
            <input type="text" class="settings-input" id="model-input" value="${config.model}">
          </div>
          <div class="settings-option">
            <label class="settings-label">Temperature (${config.temperature})</label>
            <input type="range" min="0" max="2" step="0.1" value="${config.temperature}" id="temperature-slider" style="width: 100%">
          </div>
          <div class="settings-option">
            <label class="settings-label">Max Tokens</label>
            <input type="number" class="settings-input" id="max-tokens-input" value="${config.maxTokens}" min="100" max="100000">
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Features</h3>
          <div class="settings-option">
            <div class="settings-toggle">
              <span>Memory</span>
              <div class="toggle-switch ${config.memoryEnabled ? 'active' : ''}" id="memory-toggle"></div>
            </div>
          </div>
          <div class="settings-option">
            <div class="settings-toggle">
              <span>Voice</span>
              <div class="toggle-switch ${config.voiceEnabled ? 'active' : ''}" id="voice-toggle"></div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3 class="settings-section-title">Connection</h3>
          <div class="settings-option">
            <label class="settings-label">API URL</label>
            <input type="text" class="settings-input" id="api-url-input" value="${config.apiUrl}">
          </div>
        </div>
      </div>
    </div>
  `;
}

// Event handlers
function attachEventListeners(): void {
  // New chat
  document.getElementById('new-chat-btn')?.addEventListener('click', createNewChat);
  
  // Settings
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    settingsOpen = true;
    render();
  });
  
  document.getElementById('close-settings')?.addEventListener('click', () => {
    settingsOpen = false;
    render();
  });
  
  document.getElementById('settings-overlay')?.addEventListener('click', () => {
    settingsOpen = false;
    render();
  });
  
  // Provider selection
  document.querySelectorAll('.provider-card').forEach(card => {
    card.addEventListener('click', () => {
      config.defaultProvider = card.getAttribute('data-provider') as AppConfig['defaultProvider'];
      settingsOpen = false;
      render();
      showToast('Provider updated', 'success');
    });
  });
  
  // Config changes
  document.getElementById('model-input')?.addEventListener('change', (e) => {
    config.model = (e.target as HTMLInputElement).value;
    saveConfig();
  });
  
  document.getElementById('temperature-slider')?.addEventListener('input', (e) => {
    config.temperature = parseFloat((e.target as HTMLInputElement).value);
  });
  
  document.getElementById('max-tokens-input')?.addEventListener('change', (e) => {
    config.maxTokens = parseInt((e.target as HTMLInputElement).value);
    saveConfig();
  });
  
  document.getElementById('memory-toggle')?.addEventListener('click', () => {
    config.memoryEnabled = !config.memoryEnabled;
    render();
    saveConfig();
  });
  
  document.getElementById('voice-toggle')?.addEventListener('click', () => {
    config.voiceEnabled = !config.voiceEnabled;
    render();
    saveConfig();
  });
  
  document.getElementById('api-url-input')?.addEventListener('change', (e) => {
    config.apiUrl = (e.target as HTMLInputElement).value;
    saveConfig();
  });
  
  // Conversation selection
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id')!;
      currentConversation = conversations.find(c => c.id === id) || null;
      render();
    });
  });
  
  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt')!;
      document.getElementById('message-input')?.setAttribute('value', prompt);
    });
  });
  
  // Send message
  const input = document.getElementById('message-input') as HTMLTextAreaElement;
  const sendBtn = document.getElementById('send-btn')!;
  
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  sendBtn?.addEventListener('click', sendMessage);
  
  // Auto-resize textarea
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
  });
}

// Actions
async function createNewChat(): Promise<void> {
  const title = `Chat ${new Date().toLocaleString()}`;
  try {
    const result = await apiPost<{ conversation: Conversation }>('/conversations', { title });
    conversations.unshift(result.conversation);
    currentConversation = result.conversation;
    render();
    document.getElementById('message-input')?.focus();
  } catch (error) {
    // Create local conversation if API unavailable
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.unshift(conv);
    currentConversation = conv;
    render();
  }
}

async function sendMessage(): Promise<void> {
  const input = document.getElementById('message-input') as HTMLTextAreaElement;
  const content = input?.value.trim();
  
  if (!content || isStreaming) return;
  
  // Create conversation if needed
  if (!currentConversation) {
    await createNewChat();
  }
  
  // Add user message
  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
  
  currentConversation!.messages.push(userMessage);
  input.value = '';
  input.style.height = 'auto';
  isStreaming = true;
  render();
  
  // Scroll to bottom
  setTimeout(() => {
    const messages = document.getElementById('messages');
    messages?.scrollTo(0, messages.scrollHeight);
  }, 0);
  
  try {
    // Make streaming request
    const response = await fetch(`${config.apiUrl}/chat/stream/${currentConversation!.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: currentConversation!.messages.map(m => ({ role: m.role, content: m.content })),
        provider: config.defaultProvider,
        model: config.model,
      }),
    });
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                assistantContent += data.choices[0].delta.content;
                // Update assistant message in real-time
                updateStreamingMessage(assistantContent);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }
    
    // Finalize message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantContent || 'I apologize, but I encountered an issue processing your request.',
      timestamp: Date.now(),
    };
    
    currentConversation!.messages.push(assistantMessage);
  } catch (error) {
    // Add error message
    const errorMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Sorry, I could not connect to the server. Please check your connection and try again.',
      timestamp: Date.now(),
    };
    currentConversation!.messages.push(errorMessage);
  }
  
  isStreaming = false;
  render();
  
  // Scroll to bottom
  setTimeout(() => {
    const messages = document.getElementById('messages');
    messages?.scrollTo(0, messages.scrollHeight);
  }, 0);
}

function updateStreamingMessage(content: string): void {
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) return;
  
  const lastMessage = messagesContainer.querySelector('.message.assistant:last-child .message-text');
  if (lastMessage) {
    lastMessage.innerHTML = formatMessage(content);
  }
}

function saveConfig(): void {
  localStorage.setItem('aether-config', JSON.stringify(config));
  showToast('Settings saved', 'success');
}

function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
  const container = document.getElementById('toasts');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// Utilities
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMessage(content: string): string {
  return content
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// Initialize
async function init(): Promise<void> {
  // Load config
  const savedConfig = localStorage.getItem('aether-config');
  if (savedConfig) {
    try {
      config = { ...config, ...JSON.parse(savedConfig) };
    } catch {
      // Use default config
    }
  }
  
  // Load conversations
  try {
    const result = await apiGet<{ conversations: Conversation[] }>('/conversations');
    conversations = result.conversations;
  } catch {
    // No conversations yet
  }
  
  render();
}

// Start app
document.addEventListener('DOMContentLoaded', init);

// For development without Tauri
if (typeof window !== 'undefined' && !window.__TAURI__) {
  const app = document.createElement('div');
  app.id = 'app';
  document.body.appendChild(app);
  init();
}