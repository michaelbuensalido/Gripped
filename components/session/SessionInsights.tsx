import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { ResultDonut } from '../ui/ResultDonut';
import { useTheme } from '../../theme/useTheme';
import { isSend } from '../../utils/isSend';
import { Card } from '../ui/Card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SessionInsightsProps {
  climbs: any[];
}

export function SessionInsights({ climbs }: SessionInsightsProps) {
  const { colors, space, type, radius } = useTheme();

  const CARD_WIDTH = SCREEN_WIDTH - space.lg * 2; // Full width minus horizontal padding

  const activeClimbs = useMemo(() => {
    return [...climbs]
      .filter((c) => c.deleted_at === null)
      .sort((a, b) => a.logged_at - b.logged_at);
  }, [climbs]);

  if (activeClimbs.length < 2) {
    return null; // The prompt says: "Show a fallback empty state in this block if there are fewer than 2 climbs", wait actually we should return a placeholder? Let's just return null and the parent will handle empty state, or we render a simple Card.
  }

  // Card 1: Session pyramid (using BarChart)
  const pyramidData = useMemo(() => {
    const counts: Record<string, { flashes: number; tops: number; attempts: number; gradeIndex: number }> = {};
    activeClimbs.forEach((c) => {
      const g = c.grade_raw;
      if (!counts[g]) counts[g] = { flashes: 0, tops: 0, attempts: 0, gradeIndex: c.grade_index ?? 0 };
      if (c.result === 'flash') counts[g].flashes++;
      else if (isSend(c.result)) counts[g].tops++;
      else counts[g].attempts++;
    });

    const sortedGrades = Object.keys(counts).sort((a, b) => counts[a].gradeIndex - counts[b].gradeIndex);
    
    return sortedGrades.map((g) => ({
      label: g,
      stacks: [
        { value: counts[g].flashes, color: colors.flash, marginBottom: 0 },
        { value: counts[g].tops, color: colors.top, marginBottom: counts[g].flashes > 0 ? 2 : 0 },
        { value: counts[g].attempts, color: colors.attempt, marginBottom: (counts[g].flashes > 0 || counts[g].tops > 0) ? 2 : 0 },
      ],
    }));
  }, [activeClimbs, colors]);

  const maxStackValue = useMemo(() => {
    return Math.max(1, ...pyramidData.map(d => d.stacks.reduce((acc, s) => acc + s.value, 0)));
  }, [pyramidData]);

  // Card 2: Result mix
  const { flashes, tops, attempts, hardestLabel } = useMemo(() => {
    let f = 0, t = 0, a = 0;
    let maxIdx = -1;
    let hLab = '–';
    activeClimbs.forEach((c) => {
      if (c.result === 'flash') f++;
      else if (isSend(c.result)) t++;
      else a++;

      if ((c.grade_index ?? 0) > maxIdx && isSend(c.result)) {
        maxIdx = c.grade_index ?? 0;
        hLab = c.grade_raw;
      }
    });
    return { flashes: f, tops: t, attempts: a, hardestLabel: hLab };
  }, [activeClimbs]);

  // Card 3: Difficulty curve
  const difficultyData = useMemo(() => {
    return activeClimbs.map((c) => ({
      value: c.grade_index ?? 0,
      label: c.grade_raw,
      dataPointText: c.grade_raw,
    }));
  }, [activeClimbs]);

  const maxDiff = Math.max(1, ...difficultyData.map(d => d.value));

  return (
    <View style={{ marginBottom: space.xl }}>
      <Reanimated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.md }}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + space.md}
      >
        {/* Card 1: Pyramid */}
        <Card style={{ width: CARD_WIDTH, alignItems: 'center' }}>
          <Text style={[type.label, { color: colors.textMuted, alignSelf: 'flex-start', marginBottom: space.md }]}>SESSION PYRAMID</Text>
          <View style={{ marginLeft: -12 }}>
            <BarChart
              stackData={pyramidData}
              width={CARD_WIDTH - 64}
              height={140}
              barWidth={28}
              spacing={16}
              noOfSections={Math.min(5, maxStackValue)}
              maxValue={Math.ceil(maxStackValue / 2) * 2}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              rulesColor={colors.border}
              isAnimated
            />
          </View>
        </Card>

        {/* Card 2: Result Mix */}
        <Card style={{ width: CARD_WIDTH, alignItems: 'center' }}>
          <Text style={[type.label, { color: colors.textMuted, alignSelf: 'flex-start', marginBottom: space.md }]}>RESULT MIX</Text>
          <ResultDonut
            flashCount={flashes}
            topCount={tops}
            attemptCount={attempts}
            centerGrade={hardestLabel !== '–' ? hardestLabel : undefined}
            centerLabel="HARDEST"
          />
        </Card>

        {/* Card 3: Difficulty curve */}
        <Card style={{ width: CARD_WIDTH, alignItems: 'center' }}>
          <Text style={[type.label, { color: colors.textMuted, alignSelf: 'flex-start', marginBottom: space.md }]}>DIFFICULTY CURVE</Text>
          <View style={{ marginLeft: -12 }}>
            <LineChart
              data={difficultyData}
              width={CARD_WIDTH - 64}
              height={140}
              maxValue={maxDiff + 1}
              noOfSections={4}
              color={colors.accent}
              dataPointsColor={colors.accent}
              thickness={3}
              hideDataPoints={false}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              rulesColor={colors.border}
              isAnimated
            />
          </View>
        </Card>

      </Reanimated.ScrollView>
    </View>
  );
}
