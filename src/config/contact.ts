/**
 * TODO: 개발자 이름, 문의 메일, 공개 URL은 아직 정해지지 않았다.
 * 비어 있는 동안 설정의 문의 항목은 누르지 않는다.
 * 개인정보처리방침과 이용약관, 계정 삭제 안내의 자리표시자도 여기서 채우지 않는다.
 */
export const CONTACT = {
  developerName: '',
  email: '',
  privacyPolicyUrl: '',
  termsUrl: '',
  accountDeletionUrl: '',
  websiteUrl: ''
} as const;

export interface ContactChannel {
  developerName: string;
  email: string;
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
