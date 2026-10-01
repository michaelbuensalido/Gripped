import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { GradePill } from '../components/ui/GradePill';
import { ResultChip } from '../components/ui/ResultChip';
import { Chip } from '../components/ui/Chip';
import { StatTile } from '../components/ui/StatTile';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useTheme } from '../theme/useTheme';
import { Plus, Check } from 'lucide-react-native';

export default function GalleryScreen() {
  const { colors, space } = useTheme();

  return (
    <Screen title="UI Gallery" subtitle="Design System Components">
      
      <SectionHeader title="Buttons" />
      <View style={{ gap: space.md, marginBottom: space.xl }}>
        <PrimaryButton label="Primary Button" onPress={() => {}} />
        <PrimaryButton label="Loading State" loading onPress={() => {}} />
        <PrimaryButton label="With Icon" icon={<Plus color="#FFF" size={20} />} onPress={() => {}} />
        <SecondaryButton label="Secondary Button" onPress={() => {}} />
      </View>

      <SectionHeader title="Cards" />
      <View style={{ gap: space.md, marginBottom: space.xl }}>
        <Card variant="default">
          <Text style={{ color: colors.text }}>Default Card (Shadow)</Text>
        </Card>
        <Card variant="muted">
          <Text style={{ color: colors.text }}>Muted Card (Inset)</Text>
        </Card>
        <Card variant="hero">
          <Text style={{ color: colors.textOnAccent }}>Hero Card (Gradient)</Text>
        </Card>
      </View>

      <SectionHeader title="Stat Tiles" />
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <StatTile value="108" label="Finished Routes" />
        <StatTile value="6" label="Active Routes" trend="+2" />
        <StatTile value="32" label="Flashes" />
      </View>

      <SectionHeader title="Chips & Badges" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl }}>
        <Chip label="Unselected" />
        <Chip label="Selected" selected />
        <ResultChip result="flash" />
        <ResultChip result="top" />
        <ResultChip result="attempt" />
      </View>

      <SectionHeader title="Grade Pills" />
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <GradePill gradeIndex={1} />
        <GradePill gradeIndex={4} />
        <GradePill gradeIndex={7} />
        <GradePill gradeIndex={10} />
      </View>

      <SectionHeader title="Empty State" />
      <View style={{ marginBottom: space.xl, height: 250 }}>
        <Card variant="default" style={{ flex: 1 }}>
          <EmptyState 
            title="No sessions yet" 
            body="Start your first session to see your stats."
            cta={<PrimaryButton label="Start Session" onPress={() => {}} />}
          />
        </Card>
      </View>

    </Screen>
  );
}
