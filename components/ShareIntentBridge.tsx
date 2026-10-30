import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import * as B from '../db/betaQueries';
import { detectVideoPlatform, extractSharedVideoLink } from '../utils/betaLogic';
import { triggerHaptic } from '../utils/haptics';

/**
 * Receives links shared from Instagram, TikTok, or YouTube via the Share Extension
 * and saves them straight into the local Video Inbox (SQLite). No network involved.
 */
export function ShareIntentBridge() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const router = useRouter();

  useEffect(() => {
    if (!hasShareIntent) return;
    const parsed = extractSharedVideoLink(shareIntent?.webUrl, shareIntent?.text);
    resetShareIntent();
    if (!parsed) {
      Alert.alert('Nothing to save', 'That share did not contain a video link.');
      return;
    }
    B.insertVideoInboxItem({
      videoUrl: parsed.url,
      sourceType: detectVideoPlatform(parsed.url),
      caption: parsed.caption,
    });
    triggerHaptic('success');
    router.navigate({
      pathname: '/explore',
      params: { tab: 'inbox', sharedAt: String(Date.now()) },
    });
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);

  return null;
}
