import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView, VideoContentFit } from 'expo-video';

interface VideoPlayerViewProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: VideoContentFit;
  loop?: boolean;
  autoPlay?: boolean;
  nativeControls?: boolean;
}

export function VideoPlayerView({
  uri,
  style = StyleSheet.absoluteFill,
  contentFit = 'contain',
  loop = true,
  autoPlay = true,
  nativeControls = true,
}: VideoPlayerViewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = loop;
    if (autoPlay) {
      p.play();
    }
  });

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={nativeControls}
    />
  );
}
