export function nanoid(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
