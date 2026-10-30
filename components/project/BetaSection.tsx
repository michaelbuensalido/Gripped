import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Share, Linking, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Edit2, Plus, Share2, Video, Upload, Trash2, Play, Link2, ExternalLink, FileText, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuid } from 'uuid';
import { useTheme } from '../../theme/useTheme';
import { useProjectBetas, useBetaMoves, useProjectVideos, useProject } from '../../db/hooks';
import * as B from '../../db/betaQueries';
import { storeClip } from '../../services/betaFiles';
import { formatBytes, formatTimestamp, formatBetaSummaryText, detectVideoPlatform, formatVideoPlatformLabel } from '../../utils/betaLogic';
import { triggerHaptic } from '../../utils/haptics';
import { SecondaryButton } from '../ui/SecondaryButton';
import { PrimaryButton } from '../ui/PrimaryButton';
import { BetaVideoPlayerModal } from '../media/BetaVideoPlayerModal';
import { BetaCameraRecorder } from '../media/BetaCameraRecorder';
import { ProjectShareCardModal } from './ProjectShareCardModal';

export function BetaSection({ projectId }: { projectId: string }) {
  const { colors, radius, space, type } = useTheme();
  const router = useRouter();

  const project = useProject(projectId);
  const betas = useProjectBetas(projectId);
  const currentBeta = betas.find(b => b.isCurrent) || betas[0] || null;
  const moves = useBetaMoves(currentBeta?.id || null);
  const videos = useProjectVideos(projectId);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; uri: string } | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoCaptionInput, setVideoCaptionInput] = useState('');

  // Compute total project video storage in bytes
  const storageBytes = videos.reduce((acc, v) => acc + (v.sizeBytes || 0), 0);

  const toggleVisibility = () => {
    triggerHaptic('light');
    setIsVisible(!isVisible);
  };

  const handleImportVideo = async () => {
    try {
      triggerHaptic('light');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gripped needs media library access to import beta clips.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 60,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const asset = result.assets[0];
        const fileId = uuid();
        const stored = storeClip(asset.uri, projectId, fileId);
        const duration = asset.duration ? Math.min(60, Math.round(asset.duration / 1000)) : 0;

        B.insertVideo({
          id: fileId,
          projectId,
          localUri: stored.uri,
          durationSec: duration,
          sizeBytes: stored.sizeBytes,
        });

        triggerHaptic('success');
      }
    } catch (e) {
      console.error('Import video error:', e);
      Alert.alert('Import Failed', 'Unable to import selected video clip.');
    }
  };

  const handleVideoRecorded = (uri: string) => {
    try {
      const fileId = uuid();
      const stored = storeClip(uri, projectId, fileId);
      B.insertVideo({
        id: fileId,
        projectId,
        localUri: stored.uri,
        durationSec: 0,
        sizeBytes: stored.sizeBytes,
      });
      setIsRecorderOpen(false);
      triggerHaptic('success');
    } catch (e) {
      console.error('Record attach error:', e);
      setIsRecorderOpen(false);
    }
  };

  const handleDeleteVideo = (videoId: string) => {
    Alert.alert('Delete Clip', 'Are you sure you want to delete this video clip? The file will be removed from device storage.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('medium');
          B.deleteVideo(videoId);
          if (selectedVideo?.id === videoId) {
            setSelectedVideo(null);
          }
        },
      },
    ]);
  };

  const handleShareBetaText = async () => {
    if (!project) return;
    try {
      triggerHaptic('medium');
      const summary = formatBetaSummaryText(project, currentBeta, moves, videos);
      await Share.share({
        message: summary,
        title: `Gripped Beta: ${project.title}`,
      });
      triggerHaptic('success');
    } catch (e) {
      console.warn('Share beta error:', e);
    }
  };

  const handleSaveLink = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid URL', 'Please enter or paste a valid video URL.');
      return;
    }
    const platform = detectVideoPlatform(trimmed);
    const fileId = uuid();
    B.insertVideo({
      id: fileId,
      projectId,
      localUri: trimmed,
      videoUrl: trimmed,
      sourceType: platform,
      caption: videoCaptionInput.trim() || null,
      durationSec: 0,
      sizeBytes: 0,
    });
    setVideoUrlInput('');
    setVideoCaptionInput('');
    setIsAddLinkModalOpen(false);
    triggerHaptic('success');
  };

  if (betas.length === 0) {
    return (
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
        <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>BETA</Text>
        <Text style={[type.body, { color: colors.textMuted, marginBottom: space.lg }]}>No beta added yet.</Text>
        <SecondaryButton 
          label="Add Beta" 
          onPress={() => router.push(`/project/beta-editor?projectId=${projectId}`)}
        />
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
      {/* Beta Header & Spoiler Toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isVisible ? space.md : 0 }}>
        <Text style={[type.label, { color: colors.textMuted }]}>BETA</Text>
        <TouchableOpacity
          onPress={toggleVisibility}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4 }}
          accessibilityRole="button"
          accessibilityLabel={isVisible ? "Hide beta sequence" : "Show beta sequence"}
        >
          <Text style={[type.caption, { color: colors.accent, fontWeight: '600' }]}>{isVisible ? 'Hide Beta' : 'Show Beta'}</Text>
          {isVisible ? <EyeOff size={16} color={colors.accent} /> : <Eye size={16} color={colors.accent} />}
        </TouchableOpacity>
      </View>
      
      {isVisible && (
        <View>
          {/* Version Switcher */}
          {betas.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md }}>
              {betas.sort((a,b) => a.version - b.version).map(b => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => {
                    triggerHaptic('selection');
                    B.setCurrentBeta(b.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to beta version ${b.version}`}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                    backgroundColor: b.isCurrent ? colors.accent : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: b.isCurrent ? colors.accent : colors.border,
                    marginRight: space.sm,
                    minHeight: 36,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={[type.caption, { color: b.isCurrent ? colors.textOnAccent : colors.text, fontWeight: '600' }]}>
                    v{b.version} {b.label ? `- ${b.label}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Key Tip */}
          {currentBeta?.keyTip && (
            <View style={{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.border }}>
              <Text style={[type.caption, { color: colors.accentText, fontWeight: '700', marginBottom: 2 }]}>KEY TIP</Text>
              <Text style={[type.body, { color: colors.text }]}>{currentBeta.keyTip}</Text>
            </View>
          )}

          {/* Move List */}
          {moves.length > 0 && (
            <View style={{ marginBottom: space.lg, gap: 8 }}>
              {moves.sort((a,b) => a.order - b.order).map((m, i) => {
                const isCrux = m.id === currentBeta?.cruxMoveId;
                return (
                  <View 
                    key={m.id} 
                    style={{ 
                      flexDirection: 'row', 
                      gap: 12, 
                      alignItems: 'center',
                      backgroundColor: isCrux ? 'rgba(255, 69, 58, 0.15)' : colors.cardMuted,
                      padding: 10,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: isCrux ? 'rgba(255, 69, 58, 0.4)' : colors.border,
                    }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700' }]}>{i + 1}</Text>
                    </View>
                    {m.limb && (
                      <View style={{ backgroundColor: colors.accentSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={[type.caption, { color: colors.accentText, fontSize: 10, fontWeight: '700' }]}>{m.limb}</Text>
                      </View>
                    )}
                    <Text style={[type.body, { color: colors.text, flex: 1 }]}>{m.text}</Text>
                    {isCrux && (
                      <View style={{ backgroundColor: '#FF453A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={[type.caption, { color: '#FFFFFF', fontWeight: '800', fontSize: 10, letterSpacing: 0.5 }]}>CRUX</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Video Clips List & Storage Readout */}
          <View style={{ marginBottom: space.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
              <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700', letterSpacing: 1.0 }]}>
                VIDEO CLIPS ({videos.length})
              </Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                Storage: {formatBytes(storageBytes)}
              </Text>
            </View>

            {videos.length === 0 ? (
              <Text style={[type.caption, { color: colors.textMuted, fontStyle: 'italic', marginBottom: space.sm }]}>
                No video clips attached. Record or import clips under 60 seconds.
              </Text>
            ) : (
              <View style={{ gap: 8, marginBottom: space.md }}>
                {videos.map((v, idx) => {
                  const isSocial = Boolean(v.videoUrl || (v.sourceType && v.sourceType !== 'local'));
                  const platformLabel = formatVideoPlatformLabel(v.sourceType, 'Web Link');
                  
                  return (
                    <View
                      key={v.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.cardMuted,
                        padding: 10,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {isSocial ? (
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('light');
                            const url = v.videoUrl || v.localUri;
                            Linking.openURL(url).catch((err) => {
                              console.warn('Cannot open video URL', err);
                              Alert.alert('Unable to Open', `Cannot open link: ${url}`);
                            });
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minHeight: 40 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${platformLabel} clip ${idx + 1}`}
                        >
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                            <Link2 size={16} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                              {v.caption || `${platformLabel} Beta Clip`}
                            </Text>
                            <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]} numberOfLines={1}>
                              {platformLabel} • Tap to view post
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setSelectedVideo({ id: v.id, uri: v.localUri })}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minHeight: 40 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Watch clip ${idx + 1}`}
                        >
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={14} color={colors.textOnAccent} fill={colors.textOnAccent} style={{ marginLeft: 2 }} />
                          </View>
                          <View>
                            <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]}>
                              Clip #{idx + 1} {v.durationSec ? `• ${formatTimestamp(v.durationSec)}` : ''}
                            </Text>
                            <Text style={[type.caption, { color: colors.textMuted, fontSize: 11 }]}>
                              {formatBytes(v.sizeBytes)} • Offline Ready
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handleDeleteVideo(v.id)}
                        style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete clip ${idx + 1}`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={colors.dangerText} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          
          {/* Action Buttons Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => router.push(`/project/beta-editor?projectId=${projectId}&betaId=${currentBeta?.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Edit current beta version"
            >
              <Edit2 size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Edit Beta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push(`/project/beta-editor?projectId=${projectId}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Add new beta version"
            >
              <Plus size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Add Version</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsRecorderOpen(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Record beta video (max 60 seconds)"
            >
              <Video size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Record Clip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleImportVideo}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Import video from camera roll"
            >
              <Upload size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Import Clip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsAddLinkModalOpen(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Paste video link"
            >
              <Link2 size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Paste Link</Text>
            </TouchableOpacity>

            {project && (
              <TouchableOpacity 
                onPress={handleShareBetaText}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
                accessibilityRole="button"
                accessibilityLabel="Share beta as text"
              >
                <FileText size={16} color={colors.text} />
                <Text style={[type.control, { color: colors.text }]}>Share Beta</Text>
              </TouchableOpacity>
            )}

            {project && (
              <TouchableOpacity 
                onPress={() => setIsShareModalOpen(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, minHeight: 44 }}
                accessibilityRole="button"
                accessibilityLabel="Share project card"
              >
                <Share2 size={16} color={colors.accentText} />
                <Text style={[type.control, { color: colors.accentText }]}>Share Card</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Video Player Modal */}
      <BetaVideoPlayerModal 
        visible={Boolean(selectedVideo)} 
        videoUri={selectedVideo?.uri || null} 
        videoId={selectedVideo?.id || null}
        gradeRaw={project?.gradeRaw || 'V6'}
        onDeleteClip={(vid) => handleDeleteVideo(vid)}
        onClose={() => setSelectedVideo(null)} 
      />

      {/* Camera Recorder */}
      <BetaCameraRecorder 
        visible={isRecorderOpen} 
        onClose={() => setIsRecorderOpen(false)} 
        onAttach={handleVideoRecorded}
      />

      {/* Project Share Card Modal */}
      {project && (
        <ProjectShareCardModal
          visible={isShareModalOpen}
          project={project}
          beta={currentBeta}
          moves={moves}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Paste Social Video Link Modal */}
      <Modal
        visible={isAddLinkModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddLinkModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space.lg,
              paddingBottom: Platform.OS === 'ios' ? 40 : space.lg,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
              <Text style={[type.heading, { color: colors.text, fontSize: 18 }]}>Add Video Link</Text>
              <TouchableOpacity
                onPress={() => setIsAddLinkModalOpen(false)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel="Close paste link modal"
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.md }]}>
              Paste a link from Instagram Reels, TikTok, YouTube, or the web to keep your beta inspiration attached to this project.
            </Text>

            <Text style={[type.label, { color: colors.textMuted, marginBottom: 4 }]}>VIDEO URL</Text>
            <TextInput
              style={{
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: space.md,
                color: colors.text,
                fontSize: 14,
                marginBottom: space.md,
              }}
              placeholder="https://www.instagram.com/reel/..., tiktok.com, or youtube.com"
              placeholderTextColor={colors.textMuted}
              value={videoUrlInput}
              onChangeText={setVideoUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={[type.label, { color: colors.textMuted, marginBottom: 4 }]}>CAPTION / NOTES (OPTIONAL)</Text>
            <TextInput
              style={{
                backgroundColor: colors.cardMuted,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: space.md,
                color: colors.text,
                fontSize: 14,
                marginBottom: space.lg,
              }}
              placeholder="e.g. Foot smear beta for move 3"
              placeholderTextColor={colors.textMuted}
              value={videoCaptionInput}
              onChangeText={setVideoCaptionInput}
            />

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton label="Cancel" onPress={() => setIsAddLinkModalOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Save Link" onPress={handleSaveLink} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
