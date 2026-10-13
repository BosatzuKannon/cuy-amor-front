import * as Application from 'expo-application';
import { Platform } from 'react-native';

const MAX_REFERRAL_CODE_LENGTH = 20;

let pendingReferralCode: string | null = null;
let lastCapturedUrl = '';
let installReferrerPromise: Promise<string | null> | null = null;

function normalizeReferralCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const decoded = decodeURIComponent(value).trim();
  return decoded.length > 0 && decoded.length <= MAX_REFERRAL_CODE_LENGTH
    ? decoded
    : null;
}

export function extractReferralCodeFromReferrer(referrer: string): string | null {
  const raw = referrer?.trim();
  if (!raw) {
    return null;
  }

  const keyedCode = raw.match(
    /(?:^|[?&])(?:code|ref|referral|referralCode|invitedByCode)=([^&#]+)/i,
  );
  return normalizeReferralCode(keyedCode ? keyedCode[1] : raw);
}

export async function captureInstallReferrer(): Promise<string | null> {
  if (installReferrerPromise) {
    return installReferrerPromise;
  }

  installReferrerPromise = (async () => {
    if (Platform.OS !== 'android') {
      return pendingReferralCode;
    }

    try {
      const referrer = await Application.getInstallReferrerAsync();
      const code = extractReferralCodeFromReferrer(referrer);
      if (code && !pendingReferralCode) {
        pendingReferralCode = code;
        console.log('[referral-capture] install referrer captured:', code);
      }
      return pendingReferralCode;
    } catch (error) {
      console.log('[referral-capture] install referrer unavailable:', error);
      return pendingReferralCode;
    }
  })();

  return installReferrerPromise;
}

export function extractReferralCode(url: string): string | null {
  if (!url) {
    return null;
  }

  const isInviteLink =
    /cuyamor:\/\/invite/.test(url) || /\/invite(?:\?|\/|$)/.test(url);

  if (!isInviteLink) {
    return null;
  }

  let code: string | null = null;

  const queryCode = url.match(/[?&#](?:code|ref|referral|referralCode)=([^&#]+)/);
  if (queryCode) {
    code = queryCode[1];
  }

  const pathCode = /\/invite\/([^/?]+)/.exec(url)?.[1];
  if (pathCode) {
    code = pathCode;
  }

  return normalizeReferralCode(code);
}

export function captureReferralCode(url: string): string | null {
  if (!url || url === lastCapturedUrl) {
    return pendingReferralCode;
  }

  const code = extractReferralCode(url);
  if (code) {
    pendingReferralCode = code;
    lastCapturedUrl = url;
  }

  return pendingReferralCode;
}

export function getPendingReferralCode(): string | null {
  return pendingReferralCode;
}

export function consumePendingReferralCode(): string | null {
  const code = pendingReferralCode;
  pendingReferralCode = null;
  return code;
}

export function resetReferralCode(): void {
  pendingReferralCode = null;
  lastCapturedUrl = '';
}
