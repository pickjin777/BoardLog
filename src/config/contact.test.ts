import { describe, expect, it } from 'vitest';
import { CONTACT, contactHref } from './contact';

describe('contact', () => {
  it('publishes the developer name, email, and legal URLs for the settings screen', () => {
    expect(CONTACT.developerName).toBe('진상두');
    expect(CONTACT.businessName).toBe('픽진');
    expect(CONTACT.email).toBe('pickjin777@gmail.com');
    expect(CONTACT.address).toBe('경기도 군포시 번영로 314 4층 공유오피스1호');
    expect(CONTACT.privacyPolicyUrl).toBe('https://board-log.vercel.app/privacy.html');
    expect(CONTACT.termsUrl).toBe('https://board-log.vercel.app/terms.html');
    expect(CONTACT.accountDeletionUrl).toBe('https://board-log.vercel.app/account-deletion/');
    expect(CONTACT.websiteUrl).toBe('https://board-log.vercel.app');
    expect(contactHref()).toBe('mailto:pickjin777@gmail.com');
  });

  it('opens a mailto only after an email is set, and https for a site', () => {
    const empty = {
      ...CONTACT,
      email: '',
      websiteUrl: ''
    };
    expect(contactHref(empty)).toBeNull();
    expect(contactHref({ ...empty, email: ' owner@example.com ' })).toBe('mailto:owner@example.com');
    expect(contactHref({ ...empty, websiteUrl: 'http://insecure.example' })).toBeNull();
    expect(contactHref({ ...empty, websiteUrl: 'https://board.example/privacy' })).toBe(
      'https://board.example/privacy'
    );
  });
});
