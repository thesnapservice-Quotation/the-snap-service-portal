/**
 * Web Push VAPID Configuration
 * Standard RFC 8292 VAPID protocol for Safari iOS 16.4+ PWA, Android Chrome, Mac & Windows
 */

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BDHMHFL4Pu9FDA3A4pASAMsCbu5LpYshJiGL1wlCPHMekKFKOvaywv5SAWgPw1Wm5mpIH81-T4dLxGoMjqy2Oq0';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'Hxh_enooTxKA3viR0hUdXfnEi4KBoAwdbjfTS-ExZnY';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:mail.thesnapservice@gmail.com';
