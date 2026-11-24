import { Analytics } from '@vercel/analytics/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { AGE_BAND_EVENT } from '../utils/ageGate';
import { isLocalHost, safePageLocation } from '../utils/analyticsEvents';

/**
 * Visit trend from Vercel Web Analytics (FR-MEAS-04, no cookies). Skipped on local servers, where the
 * script does not exist, and until the person says they are 14 or older. The address is sent
 * without its #fragment.
 */
export const VercelAnalytics: React.FC = () => {
  const [allowed, setAllowed] = useState(() => storage.allowsOffDeviceCollection());
  useEffect(() => {
    const sync = () => setAllowed(storage.allowsOffDeviceCollection());
    window.addEventListener(AGE_BAND_EVENT, sync);
    return () => window.removeEventListener(AGE_BAND_EVENT, sync);
  }, []);
  if (isLocalHost(window.location.hostname) || !allowed) return null;
  return <Analytics beforeSend={(event) => ({ ...event, url: safePageLocation(event.url) })} />;
};
