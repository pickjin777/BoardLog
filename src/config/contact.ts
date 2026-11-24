/**
 * Public contact for the settings screen. The street address and email stay here and in
 * docs/legal, not in other features.
 */
export const CONTACT = {
  developerName: '진상두',
  businessName: '픽진',
  email: 'pickjin777@gmail.com',
  address: '경기도 군포시 번영로 314 4층 공유오피스1호',
  privacyPolicyUrl: 'https://board-log.vercel.app/privacy.html',
  termsUrl: 'https://board-log.vercel.app/terms.html',
  accountDeletionUrl: 'https://board-log.vercel.app/account-deletion/',
  websiteUrl: 'https://board-log.vercel.app'
} as const;

export interface ContactChannel {
  developerName: string;
  businessName: string;
  email: string;
  address: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  accountDeletionUrl: string;
  websiteUrl: string;
}

/** A mailto or https link we can actually open. Empty placeholders stay closed. */
export function contactHref(contact: ContactChannel = CONTACT): string | null {
  const email = contact.email.trim();
  if (email) return `mailto:${email}`;
  const site = contact.websiteUrl.trim();
  if (/^https:\/\//i.test(site)) return site;
  return null;
}
