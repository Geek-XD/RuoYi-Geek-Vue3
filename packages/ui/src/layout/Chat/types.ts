import type { Component } from 'vue';

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export type ChatMessageDirection = 'incoming' | 'outgoing' | 'center';
export type ChatMessageStatus = 'default' | 'streaming' | 'error';
export type ChatLayoutMode = 'page' | 'window' | 'float';

export interface ChatContact {
  id: string | number;
  name?: string;
  avatar?: string;
  email?: string;
  online?: boolean;
  lastMsg?: string;
  [key: string]: unknown;
}

export interface ChatMessageBlock {
  key?: string | number;
  type?: string;
  content?: string;
  html?: string;
  props?: Record<string, unknown>;
}

export interface ChatMessage {
  id?: string | number;
  role?: ChatMessageRole;
  direction?: ChatMessageDirection;
  from?: string;
  name?: string;
  avatar?: string;
  content?: string;
  blocks?: ChatMessageBlock[];
  time?: string;
  status?: ChatMessageStatus;
  streaming?: boolean;
  meta?: Record<string, unknown>;
}

export interface LegacyChatMessage {
  id?: string | number;
  from: string;
  content: string;
  time: string;
  avatar?: string;
  status?: ChatMessageStatus;
  streaming?: boolean;
  meta?: Record<string, unknown>;
}

export type ChatMessageLike = ChatMessage | LegacyChatMessage;

export interface NormalizedChatMessage {
  id: string | number;
  role?: ChatMessageRole;
  direction: ChatMessageDirection;
  name: string;
  avatar?: string;
  content: string;
  blocks: ChatMessageBlock[];
  time?: string;
  status: ChatMessageStatus;
  meta?: Record<string, unknown>;
  raw: ChatMessageLike;
}

export type ChatMessageParser = (message: NormalizedChatMessage) => ChatMessageBlock[] | null | undefined;

export interface NormalizeChatMessageOptions {
  selfName?: string;
  selfAvatar?: string;
  fallbackAvatar?: string;
  contact?: ChatContact;
  fallbackId?: string | number;
  messageParser?: ChatMessageParser;
}

export interface ChatRailItem {
  key: string | number;
  label: string;
  icon?: Component;
  kind?: 'view' | 'action';
  disabled?: boolean;
  badge?: string | number;
  dot?: boolean;
}
