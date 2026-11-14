import { describe, expect, it } from 'vitest';
import { CONTACT, contactHref } from './contact';

describe('contact placeholders', () => {
  it('ships with empty name, email, and public URLs', () => {
    expect(CONTACT.developerName).toBe('');
    expect(CONTACT.email).toBe('');
    expect(CONTACT.privacyPolicyUrl).toBe('');
    expect(CONTACT.termsUrl).toBe('');
    expect(CONTACT.accountDeletionUrl).toBe('');
    expect(CONTACT.websiteUrl).toBe('');
    expect(contactHref()).toBeNull();
  });

  it('opens a mailto only after an email is set, and https for a site', () => {
    expect(contactHref({ ...CONTACT, email: ' owner@example.com ' })).toBe('mailto:owner@example.com');
    expect(contactHref({ ...CONTACT, websiteUrl: 'http://insecure.example' })).toBeNull();
    expect(contactHref({ ...CONTACT, websiteUrl: 'https://board.example/privacy' })).toBe(
      'https://board.example/privacy'
    );
  });
});
