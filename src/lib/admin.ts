const ADMIN_EMAILS = [
  'carlos87jaramillo@gmail.com',
  'zeus6281@gmail.com',
  'lotoiacaro@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
