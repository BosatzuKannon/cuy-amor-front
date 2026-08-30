let pendingReferralCode: string | null = null;
let lastCapturedUrl = '';

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

  if (!code) {
    return null;
  }

  const decoded = decodeURIComponent(code).trim();
  return decoded.length > 0 && decoded.length <= 20 ? decoded : null;
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
