/**
 * Single source for the Play package name and the native shell's API origin.
 * `scripts/check-native-identity.mjs` fails when the Android project drifts.
 * These are public identifiers, not secrets.
 */
export const APP_ID = 'com.pickjin.boardlog';
export const APP_NAME = '보드로그';

/** Owner-confirmed production web origin (CLAUDE.md, 2026-10-30). */
export const PRODUCTION_ORIGIN = 'https://board-log.vercel.app';
