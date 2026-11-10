import { describe, expect, it } from 'vitest';
import { scanAvailableFromResponse } from './scanAvailability';

describe('scanAvailableFromResponse', () => {
  it('turns the button on only for an explicit available flag', () => {
    expect(scanAvailableFromResponse(200, { available: true })).toBe(true);
  });

  it('stays off for a missing key, a failed probe, or a vague body', () => {
    expect(scanAvailableFromResponse(200, { available: false })).toBe(false);
    expect(scanAvailableFromResponse(503, { code: 'NOT_CONFIGURED' })).toBe(false);
    expect(scanAvailableFromResponse(404, null)).toBe(false);
    expect(scanAvailableFromResponse(200, {})).toBe(false);
    expect(scanAvailableFromResponse(200, null)).toBe(false);
    expect(scanAvailableFromResponse(200, 'yes')).toBe(false);
  });
});
