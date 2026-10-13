/**
 * The share extension reopens the app with a `cruxlog://dataUrl=...` deep link.
 * That is not a route, so send it to Home; ShareIntentBridge consumes the payload.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('dataUrl=')) return '/';
  return path;
}
