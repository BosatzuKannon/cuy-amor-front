import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';

export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER';

export type ChatMatch = {
  id: string;
  createdAt: string;
  otherUser: {
    id: string;
    firstName: string;
    gender: GenderCode | null;
    lastSeen: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
    recipientId: string | null;
  } | null;
  hasUnread: boolean;
};

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getMatches(session: Session): Promise<ChatMatch[]> {
  const { data } = await api.get<ChatMatch[]>('/matches', {
    headers: authHeaders(session),
  });

  return data;
}

export async function updateLastSeen(session: Session): Promise<void> {
  await api.patch('/users/last-seen', {}, { headers: authHeaders(session) });
}

export type ChatMessage = {
  id: string;
  content: string;
  isRead: boolean;
  isPriority: boolean;
  createdAt: string;
  senderId: string;
  recipientId: string | null;
  replyToId?: string | null;
};

export async function getMessages(
  session: Session,
  matchId: string,
): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(
    `/matches/${matchId}/messages`,
    { headers: authHeaders(session) },
  );

  return data;
}

export async function markMatchRead(
  session: Session,
  matchId: string,
): Promise<void> {
  await api.patch(
    `/matches/${matchId}/read`,
    {},
    { headers: authHeaders(session) },
  );
}

export async function sendMessage(
  session: Session,
  matchId: string,
  content: string,
  replyToId?: string,
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(
    `/matches/${matchId}/messages`,
    { content, replyToId },
    { headers: authHeaders(session) },
  );

  return data;
}