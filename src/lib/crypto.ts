/**
 * Cryptographic security utilities for password hashing and secure IDs
 * Uses standard Web Crypto API (supported natively in all modern browsers and Node.js)
 */

export async function hashPassword(password: string, salt = 'snap_service_salt_v1'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + salt);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback hash implementation if crypto.subtle is not accessible
  let hash = 0;
  const str = password + ':' + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

export async function verifyPassword(password: string, storedHash: string, salt = 'snap_service_salt_v1'): Promise<boolean> {
  if (!password || !storedHash) return false;
  // If stored password is still legacy plaintext, support migration
  if (storedHash === password) return true;
  
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

/**
 * Generate cryptographically secure, unpredictable UUIDs (avoids Date.now() collisions)
 */
export function generateSecureId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix ? prefix + '-' : ''}${crypto.randomUUID()}`;
  }
  // Fallback random generation
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix ? prefix + '-' : ''}${Date.now()}-${rand}`;
}

/**
 * Generate a cryptographically secure random numeric ID (e.g. 6 digits: 100000 to 999999)
 * Used for random global unique quotation access codes in the portal URL.
 */
export function generateRandomNumericId(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const range = max - min + 1;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const num = min + (arr[0] % range);
    return num.toString();
  }

  const num = Math.floor(min + Math.random() * range);
  return num.toString();
}
