import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { StatTile } from '../../components/ui/StatTile';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { GradePill } from '../../components/ui/GradePill';
import { ResultChip, ResultType } from '../../components/ui/ResultChip';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/useTheme';
import { useActiveSession, useSessionClimbs } from '../../db/hooks';
import { useSessionStore } from '../../store/sessionStore';

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { colors, space, type, radius } = useTheme();
  
  const session = useActiveSession();
  const climbs = useSessionClimbs(session?.id || '');
  const { isLogSheetOpen, setLogSheetOpen, logGenericAscent } = useSessionStore();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <Screen title="No Active Session">
        <PrimaryButton label="Start New Session" onPress={() => router.replace('/session/new')} />
      </Screen>
    );
  }

  const sends = climbs.filter((c: any) => c.result === 'send' || c.result === 'flash' || c.result === 'top');
  const attempts = climbs.length;
  const hardestIndex = sends.reduce((max: number, c: any) => Math.max(max, c.normalized_difficulty), 0);

  // Quick Log State
  const [logResult, setLogResult] = useState<ResultType>('top');
  const [logGrade, setLogGrade] = useState('V4');
  const [logAttempts, setLogAttempts] = useState('1');

  const handleSaveLog = () => {
    logGenericAscent({
      gradeRaw: logGrade,
      outcome: logResult === 'top' ? 'send' : logResult,
      movesLinked: parseInt(logAttempts) || 1,
    });
    setLogSheetOpen(false);
  };

  return (
    <Screen 
      title={session.gymName || 'Active Session'} 
      subtitle={formatDuration(elapsed)}
      headerRight={<SecondaryButton label="End" onPress={() => router.push('/session/end')} />}
    >
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.xl }}>
        <StatTile label="Sends" value={sends.length} />
        <StatTile label="Attempts" value={attempts} />
        <StatTile label="Hardest" value={`V${hardestIndex}`} />
      </View>

      <SectionHeader title="Session Climbs" />
      <View style={{ gap: space.sm, marginBottom: space.xxl }}>
        {climbs.map((climb: any) => (
          <Card 
            key={climb.id} 
            variant="muted" 
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md }}
            onPress={() => {
              setLogGrade(climb.grade_raw);
              setLogResult(climb.result === 'send' ? 'top' : (climb.result as ResultType));
              setLogAttempts(climb.attempts.toString());
              setLogSheetOpen(true);
              // Store pending edit id somewhere, or assume we delete old and create new
              require('../../db/queries').deleteBoulderLog(climb.id);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <GradePill gradeIndex={climb.normalized_difficulty} label={climb.grade_raw} />
              <ResultChip result={climb.result === 'send' ? 'top' : (climb.result as ResultType) || 'attempt'} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Text style={[{ color: colors.textMuted }, type.caption]}>{climb.attempts} attempt(s)</Text>
              <TouchableOpacity onPress={() => require('../../db/queries').deleteBoulderLog(climb.id)}>
                <X color={colors.danger} size={16} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        {climbs.length === 0 && (
          <Text style={[{ color: colors.textMuted, textAlign: 'center', marginTop: space.xl }, type.body]}>No climbs logged yet.</Text>
        )}
      </View>

      {/* Floating Action */}
      <View style={{ position: 'absolute', bottom: space.xl, left: 0, right: 0 }}>
        <PrimaryButton icon={<Plus color={colors.textOnAccent} size={20} />} label="LOG CLIMB" onPress={() => setLogSheetOpen(true)} />
      </View>

      {/* Log Sheet Modal */}
      <Modal visible={isLogSheetOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
              <Text style={[{ color: colors.text }, type.title]}>Log Climb</Text>
              <TouchableOpacity onPress={() => setLogSheetOpen(false)}>
                <X color={colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Result" />
            <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.lg }}>
              {(['flash', 'top', 'attempt'] as ResultType[]).map((r) => (
                <TouchableOpacity key={r} onPress={() => setLogResult(r)} style={{ opacity: logResult === r ? 1 : 0.5 }}>
                  <ResultChip result={r} />
                </TouchableOpacity>
              ))}
            </View>

            <SectionHeader title="Grade" />
            <TextInput
              value={logGrade}
              onChangeText={setLogGrade}
              placeholder="e.g. V4"
              style={[{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, color: colors.text, marginBottom: space.lg }, type.body]}
            />

            <SectionHeader title="Attempts" />
            <TextInput
              value={logAttempts}
              onChangeText={setLogAttempts}
              keyboardType="number-pad"
              style={[{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, color: colors.text, marginBottom: space.xl }, type.body]}
            />

            <PrimaryButton label="SAVE CLIMB" onPress={handleSaveLog} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
