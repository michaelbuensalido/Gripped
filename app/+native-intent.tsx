/**
 * The share extension reopens the app with a `cruxlog://dataUrl=...` deep link.
 * That is not a route, so send it to Home; ShareIntentBridge consumes the payload.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('dataUrl=')) return '/';
  if (path.includes('session/') && !path.includes('session/detail/') && !path.includes('session/end') && !path.includes('session/summary')) {
    return '/session/active';
  }
  return path;
}
