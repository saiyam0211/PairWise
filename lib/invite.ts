const APP_SCHEME = 'PairWise';

export function buildInviteMessage(code: string, partnerName?: string): string {
  const name = partnerName?.trim();
  const greeting = name ? `Hey ${name}! ` : '';
  return `${greeting}Join me on PairWise to track our budget together.\n\nInvite code: ${code}\n\nOpen: ${APP_SCHEME}://join?code=${code}`;
}

export function whatsAppUrl(message: string): string {
  return `whatsapp://send?text=${encodeURIComponent(message)}`;
}

export function smsUrl(message: string): string {
  return `sms:?body=${encodeURIComponent(message)}`;
}
