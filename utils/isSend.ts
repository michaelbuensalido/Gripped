/**
 * Pure helper function to determine if a climb outcome is a send.
 * A send is a Flash or a Top (or legacy 'send').
 * An Attempt (or 'fall') is NOT a send.
 */
export function isSend(result?: string | null): boolean {
  if (!result) return false;
  const r = result.toLowerCase().trim();
  return r === 'flash' || r === 'top' || r === 'send';
}

export function countSends(climbs: Array<{ result?: string | null }>): number {
  return climbs.filter(c => isSend(c.result)).length;
}
