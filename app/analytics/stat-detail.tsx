import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { useProgressStats } from '../../db/hooks';
import { useTheme } from '../../theme/useTheme';

export default function StatDetailScreen() {
  const { stat, period } = useLocalSearchParams<{ stat: string; period: any }>();
  const router = useRouter();
  const { colors, type, space } = useTheme();

  const stats = useProgressStats(period || '30d');

  let title = 'Trend Details';
  let chartData: any[] = [];
  let isBar = false;

  if (stat === 'volume') {
    title = 'Weekly Volume';
    isBar = true;
    chartData = stats.weeklyVolume.map((v: any) => ({
      value: v.count,
      label: v.week.split('-')[1], // Just show week number
    }));
  } else if (stat === 'hardest') {
    title = 'Hardest Send';
    chartData = stats.hardestSend.map((v: any) => ({
      value: v.max_grade,
      label: v.week.split('-')[1],
    }));
  } else if (stat === 'flash') {
    title = 'Flash Rate';
    chartData = [{ value: stats.rates.flashRate }, { value: stats.rates.flashRate }];
  }

  return (
    <Screen
      title={title}
      subtitle={`Over ${period?.toUpperCase() || '30D'}`}
      headerRight={<SecondaryButton label="Done" onPress={() => router.back()} />}
    >
      <Card style={{ padding: space.xl, alignItems: 'center', marginTop: space.xl }}>
        {chartData.length > 0 ? (
          isBar ? (
            <BarChart
              data={chartData}
              height={200}
              width={280}
              frontColor={colors.accent}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              noOfSections={4}
            />
          ) : (
            <LineChart
              data={chartData}
              height={200}
              width={280}
              color={colors.accent}
              thickness={3}
              dataPointsColor={colors.accent}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
              noOfSections={4}
            />
          )
        ) : (
          <Text style={[type.body, { color: colors.textMuted }]}>Not enough data</Text>
        )}
      </Card>
    </Screen>
  );
}
