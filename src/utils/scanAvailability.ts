/** What a scan-status response means. The key itself never arrives in this body. */
export function scanAvailableFromResponse(status: number, body: unknown): boolean {
  if (status !== 200 || typeof body !== 'object' || body === null) return false;
  return (body as { available?: unknown }).available === true;
}
