import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export type PayoutRequestPayload = {
  nequiNumber: string;
  amountInCents: number;
};

export type PayoutRequestResponse = {
  id: string;
  amountInCents: number;
  status: string;
  createdAt: string;
};

export type WalletHistoryEntry = {
  id: string;
  type:
    | 'COIN_RECHARGE'
    | 'GIFT_SENT'
    | 'PRIORITY_MESSAGE'
    | 'BOOST_PURCHASE'
    | 'REFERRAL_COMMISSION'
    | 'WELCOME_GIFT'
    | 'NINJA_ACTIVATED'
    | 'ZUMBIDO_SENT'
    | 'VIP_SUBSCRIPTION'
    | 'PAYOUT_REQUEST';
  amountInCents: number;
  currencyType: 'CUY_COINS' | 'REAL_MONEY';
  description: string;
  createdAt: string;
};

export type WalletHistoryParams = {
  currencyType: 'CUY_COINS' | 'REAL_MONEY';
  from?: string;
  to?: string;
};

function getAuthHeaders() {
  const token = useAuthStore.getState().session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestPayout(payload: PayoutRequestPayload): Promise<PayoutRequestResponse> {
  const { data } = await api.post<PayoutRequestResponse>('/wallet/payout', payload, {
    headers: getAuthHeaders(),
  });
  return data;
}

export async function getWalletHistory(params: WalletHistoryParams): Promise<WalletHistoryEntry[]> {
  const { data } = await api.get<WalletHistoryEntry[]>('/wallet/history', {
    headers: getAuthHeaders(),
    params: {
      currencyType: params.currencyType,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  });
  return data;
}
