import ChatLayout from './layout/index.vue';
import ContactList from './components/contact-list.vue';
import ContactItem from './components/contact-item.vue';
import ChatInput from './components/chat-input.vue';
import ChatMessageBlock from './components/chat-message-block.vue';
import ChatMessageRow from './components/chat-message-row.vue';
import ChatSessionList from './components/chat-session-list.vue';
import ChatToolbar from './components/chat-toolbar.vue';
import ChatApp from './app/chat-app.vue';

export type {
  ChatContact,
  ChatMessage,
  ChatMessageBlock as ChatMessageBlockType,
  ChatMessageDirection,
  ChatMessageLike,
  ChatMessageParser,
  ChatMessageRole,
  ChatMessageStatus,
  LegacyChatMessage,
  NormalizeChatMessageOptions,
  NormalizedChatMessage,
} from './types';

export {
  appendChatMessageChunk,
  completeChatMessage,
  createChatMessage,
  createChatMessageId,
  createTextBlock,
  formatChatMessageTime,
  getChatAvatarFallbackText,
  normalizeChatMessage,
} from './utils';

export {
  ChatLayout,
  ContactList,
  ContactItem,
  ChatInput,
  ChatMessageBlock,
  ChatMessageRow,
  ChatSessionList,
  ChatToolbar,
  ChatApp,
};
