import type {
  ChatMessage,
  ChatMessageBlock,
  ChatMessageDirection,
  ChatMessageLike,
  ChatMessageStatus,
  NormalizeChatMessageOptions,
  NormalizedChatMessage,
} from './types';

function hasBlocks(message: ChatMessageLike): message is ChatMessage & { blocks: ChatMessageBlock[] } {
  return Array.isArray((message as ChatMessage).blocks);
}

export function createChatMessageId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatChatMessageTime(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function createTextBlock(content = '', block: Partial<ChatMessageBlock> = {}): ChatMessageBlock {
  return {
    type: 'text',
    content,
    ...block,
  };
}

export function createChatMessage(message: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: message.id ?? createChatMessageId(),
    content: message.content ?? '',
    status: message.status ?? (message.streaming ? 'streaming' : 'default'),
    ...message,
  };
}

export function appendChatMessageChunk(message: ChatMessage, chunk: string) {
  if (!chunk) {
    return message;
  }

  message.content = `${message.content ?? ''}${chunk}`;
  message.status = 'streaming';
  message.streaming = true;

  // Keep content as the single source of truth unless the caller is explicitly
  // managing structured blocks. This allows parser-driven rendering to re-run
  // on every streamed chunk and upgrade the message as soon as a full marker arrives.
  if (!message.blocks?.length) {
    return message;
  }

  const lastBlock = message.blocks[message.blocks.length - 1];
  if (lastBlock?.type === 'text' && !lastBlock.html && !lastBlock.props) {
    lastBlock.content = `${lastBlock.content ?? ''}${chunk}`;
    return message;
  }

  message.blocks = [...message.blocks, createTextBlock(chunk)];
  return message;
}

export function completeChatMessage(message: ChatMessage, status: ChatMessageStatus = 'default') {
  message.status = status;
  message.streaming = false;
  return message;
}

export function getChatAvatarFallbackText(name?: string) {
  const value = name?.trim();
  if (!value) {
    return '?';
  }
  return value.slice(0, 1).toUpperCase();
}

function resolveDirection(message: ChatMessageLike, selfName?: string): ChatMessageDirection {
  if ('direction' in message && message.direction) {
    return message.direction;
  }

  if ('role' in message && message.role) {
    if (message.role === 'user') {
      return 'outgoing';
    }
    if (message.role === 'system') {
      return 'center';
    }
    return 'incoming';
  }

  return message.from === selfName ? 'outgoing' : 'incoming';
}

export function normalizeChatMessage(
  message: ChatMessageLike,
  options: NormalizeChatMessageOptions = {},
): NormalizedChatMessage {
  const direction = resolveDirection(message, options.selfName);
  const content = message.content ?? '';
  const name = message.name ?? message.from ?? (
    direction === 'outgoing'
      ? options.selfName
      : options.contact?.name
  ) ?? '';
  const avatar = message.avatar ?? (
    direction === 'outgoing'
      ? options.selfAvatar
      : options.contact?.avatar
  ) ?? options.fallbackAvatar;
  const status = message.status ?? (message.streaming ? 'streaming' : 'default');

  const normalized: NormalizedChatMessage = {
    id: message.id ?? options.fallbackId ?? createChatMessageId(),
    role: 'role' in message ? message.role : undefined,
    direction,
    name,
    avatar,
    content,
    blocks: [],
    time: message.time,
    status,
    meta: message.meta,
    raw: message,
  };

  const parsedBlocks = options.messageParser?.(normalized) ?? [];
  normalized.blocks = hasBlocks(message)
    ? message.blocks
    : parsedBlocks.length
      ? parsedBlocks
      : content
        ? [createTextBlock(content)]
        : [];

  return normalized;
}
