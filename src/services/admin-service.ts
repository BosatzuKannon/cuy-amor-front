import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';

export type VerificationStatusCode = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PayoutStatusCode = 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';

export type AdminVerificationUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
};

export type AdminVerificationRequest = {
  id: string;
  selfieUrl: string;
  status: VerificationStatusCode;
  createdAt: string;
  updatedAt: string;
  user: AdminVerificationUser;
};

export type AdminPayoutUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AdminPayoutRequest = {
  id: string;
  amountInCents: number;
  status: PayoutStatusCode;
  adminNotes?: string | null;
  payoutProofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminPayoutUser;
};

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getVerificationRequests(
  session: Session,
  status?: VerificationStatusCode,
): Promise<AdminVerificationRequest[]> {
  const { data } = await api.get<AdminVerificationRequest[]>(
    '/admin/verifications',
    {
      headers: authHeaders(session),
      params: status ? { status } : undefined,
    },
  );
  return data;
}

export async function approveVerification(
  session: Session,
  requestId: string,
): Promise<AdminVerificationRequest> {
  const { data } = await api.patch<AdminVerificationRequest>(
    `/admin/verifications/${requestId}/approve`,
    {},
    { headers: authHeaders(session) },
  );
  return data;
}

export async function rejectVerification(
  session: Session,
  requestId: string,
): Promise<AdminVerificationRequest> {
  const { data } = await api.patch<AdminVerificationRequest>(
    `/admin/verifications/${requestId}/reject`,
    {},
    { headers: authHeaders(session) },
  );
  return data;
}

export async function getPayoutRequests(
  session: Session,
  status?: PayoutStatusCode,
): Promise<AdminPayoutRequest[]> {
  const { data } = await api.get<AdminPayoutRequest[]>('/admin/payouts', {
    headers: authHeaders(session),
    params: status ? { status } : undefined,
  });
  return data;
}

export async function approvePayout(
  session: Session,
  payoutId: string,
): Promise<{ id: string; status: PayoutStatusCode }> {
  const { data } = await api.patch<{ id: string; status: PayoutStatusCode }>(
    `/admin/payouts/${payoutId}/approve`,
    {},
    { headers: authHeaders(session) },
  );
  return data;
}

export async function rejectPayout(
  session: Session,
  payoutId: string,
  adminNotes?: string,
): Promise<{ id: string; status: PayoutStatusCode }> {
  const { data } = await api.patch<{ id: string; status: PayoutStatusCode }>(
    `/admin/payouts/${payoutId}/reject`,
    { adminNotes },
    { headers: authHeaders(session) },
  );
  return data;
}
