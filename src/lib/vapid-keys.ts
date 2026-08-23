/**
 * Web Push VAPID Configuration
 * Standard RFC 8292 VAPID protocol for Safari iOS 16.4+ PWA, Android Chrome, Mac & Windows
 */

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BIa7haUilOOboDXdqV9UtEc4VKvt3xCaJb00JJPgB52gb08qTehhTEE4VpT3I_prnNxAXSMBE0_INSSLaXA5m_k';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'wUFVo1wku9IbvECRaErW2N-KaYzAJVM1mY9EY62OyGw';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:mail.thesnapservice@gmail.com';
