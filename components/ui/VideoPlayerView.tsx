import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, Image } from 'react-native';
import { useVideoPlayer, VideoView, VideoContentFit } from 'expo-video';

interface VideoPlayerViewProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: VideoContentFit;
  loop?: boolean;
  autoPlay?: boolean;
  nativeControls?: boolean;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export function VideoPlayerView({
  uri,
  style = StyleSheet.absoluteFill,
  contentFit = 'contain',
  loop = true,
  autoPlay = true,
  nativeControls = true,
}: VideoPlayerViewProps) {
  const isImage = IMAGE_EXTENSIONS.some((ext) => uri?.toLowerCase().endsWith(ext));

  if (isImage) {
    return (
      <Image
        source={{ uri }}
        style={style as any}
        resizeMode={contentFit === 'cover' ? 'cover' : 'contain'}
      />
    );
  }

  return (
    <ActiveVideoPlayer
      uri={uri}
      style={style}
      contentFit={contentFit}
      loop={loop}
      autoPlay={autoPlay}
      nativeControls={nativeControls}
    />
  );
}

function ActiveVideoPlayer({
  uri,
  style,
  contentFit,
  loop,
  autoPlay,
  nativeControls,
}: VideoPlayerViewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = loop ?? true;
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
