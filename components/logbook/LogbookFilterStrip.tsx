import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';

export type LogbookFilter = 'all' | 'sent' | 'video' | 'v5plus';

interface FilterChip {
  key: LogbookFilter;
  label: string;
}

const FILTERS: FilterChip[] = [
  { key: 'all',    label: 'ALL' },
  { key: 'sent',   label: 'SENT' },
  { key: 'video',  label: 'BETA' },
  { key: 'v5plus', label: 'V5+' },
];

interface LogbookFilterStripProps {
  active: LogbookFilter;
  onChange: (filter: LogbookFilter) => void;
}

export function LogbookFilterStrip({ active, onChange }: LogbookFilterStripProps) {
  return (
    <View className="mb-6">
      <Reanimated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTERS.map((chip) => {
          const isActive = chip.key === active;
          return (
            <TouchableOpacity
              key={chip.key}
              onPress={() => { triggerHaptic('light'); onChange(chip.key); }}
              activeOpacity={0.7}
              className={`h-[36px] px-4 rounded-lg items-center justify-center border ${
                isActive ? 'bg-[#6EE756]/10 border-[#6EE756]' : 'bg-[#141417] border-[#27272F]'
              }`}
            >
              <Text 
                className={`text-[12px] font-bold tracking-wider uppercase ${
                  isActive ? 'text-[#6EE756]' : 'text-[#9090A0]'
                }`}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Reanimated.ScrollView>
    </View>
  );
}
