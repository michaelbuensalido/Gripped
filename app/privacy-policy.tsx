import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

const SECTIONS = [
  {
    title: 'What Data We Collect',
    body: `CruxLog collects only the data you actively enter into the app:\n\n• Session logs (date, gym, climbs, grades, outcomes)\n• Project details (name, grade, wall angle, hold type, notes)\n• Beta videos and photos you choose to record\n• App preferences and settings\n\nWe do not collect your name, email address, or any personally identifiable information.`,
  },
  {
    title: 'Where Your Data Lives',
    body: `All data is stored exclusively on your device using a local SQLite database. Nothing is transmitted to any server, cloud service, or third party.\n\nCruxLog is fully offline-first. It does not require an internet connection and does not send any data over the network.`,
  },
  {
    title: 'Camera & Microphone',
    body: `CruxLog requests camera and microphone access solely to allow you to record beta videos of your climbing attempts. These recordings are saved to your device's local storage. They are never uploaded, shared, or analysed by any external service.`,
  },
  {
    title: 'Photo Library',
    body: `If you choose to save a beta recording to your photo library, CruxLog requests the "Add Photos" permission. We do not read from your existing photo library. We only write files you explicitly choose to export.`,
  },
  {
    title: 'Third-Party Services',
    body: `CruxLog does not integrate any analytics SDK, advertising network, crash-reporting service, or social login. There are no third-party SDKs that collect behavioural data.`,
  },
  {
    title: 'Data Deletion',
    body: `You can delete any data at any time from within the app:\n\n• Delete individual climbs or sessions from the session detail screen\n• Delete projects from the project detail screen\n• Delete all app data by uninstalling CruxLog from your device\n\nUninstalling the app permanently removes the local database and all associated media files.`,
  },
  {
    title: 'Children\'s Privacy',
    body: `CruxLog is not directed at children under the age of 13. We do not knowingly collect data from children. Because all data is local and no account is required, there is no mechanism by which a child's data would be transmitted anywhere.`,
  },
  {
    title: 'Changes to This Policy',
    body: `If this policy changes materially, we will update the "Last updated" date below and note the change in the app's release notes. Continued use of the app after an update constitutes acceptance of the revised policy.`,
  },
  {
    title: 'Contact',
    body: `If you have any questions about this privacy policy, please open an issue on our GitHub repository or contact us via the App Store developer page.`,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgTexture }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.lg,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: space.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: space.xs, marginLeft: -space.xs, marginRight: space.sm }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[type.heading, { color: colors.text, fontSize: 20 }]}>Privacy Policy</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + 40 }}
      >
        <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.xl }]}>
          Last updated: October 2026
        </Text>

        <Text style={[type.body, { color: colors.text, marginBottom: space.xl, lineHeight: 22 }]}>
          CruxLog is a personal climbing tracker that stores all your data locally on your device. We take
          your privacy seriously and have designed the app so that your data never leaves your device without
          your explicit action.
        </Text>

        {SECTIONS.map((section, i) => (
          <View
            key={i}
            style={{
              marginBottom: space.xl,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space.lg,
            }}
          >
            <Text style={[type.heading, { color: colors.text, fontSize: 15, marginBottom: space.sm }]}>
              {section.title}
            </Text>
            <Text style={[type.body, { color: colors.textMuted, lineHeight: 22 }]}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
