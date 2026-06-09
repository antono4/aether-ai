import { invoke } from '@tauri-apps/api/core';
import { Message, Conversation, AppConfig } from '@aether/shared-types';

const API_URL = 'http://localhost:4000/api';

export interface AetherDesktopAPI {
  getConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  sendMessage(conversationId: string, content: string): Promise<Message>;
  getConfig(): Promise<AppConfig>;
  setConfig(config: Partial<AppConfig>): Promise<void>;
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/conversations`);
  return response.json();
}

export async function createConversation(title: string): Promise<Conversation> {
  const response = await fetch(`${API_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return response.json();
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return response.json();
}

export async function initializeApp(): Promise<void> {
  console.log('Aether Desktop initializing...');
  
  try {
    const conversations = await getConversations();
    console.log(`Loaded ${conversations.length} conversations`);
  } catch (error) {
    console.log('Backend not available, running in offline mode');
  }
}

// UI Components placeholder
export function createAppRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'aether-root';
  root.innerHTML = `
    <div class="aether-app">
      <header class="aether-header">
        <h1>✨ Aether</h1>
        <nav>
          <button id="new-chat">New Chat</button>
          <button id="settings">Settings</button>
        </nav>
      </header>
      <main class="aether-main">
        <aside class="aether-sidebar">
          <div class="conversation-list"></div>
        </aside>
        <section class="aether-chat">
          <div class="messages"></div>
          <div class="input-area">
            <textarea placeholder="Ask Aether anything..."></textarea>
            <button id="send">Send</button>
          </div>
        </section>
      </main>
    </div>
  `;
  return root;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
}