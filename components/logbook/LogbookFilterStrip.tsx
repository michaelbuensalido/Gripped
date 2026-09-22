import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
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
      <ScrollView
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
                isActive ? 'bg-[#6EE756]/10 border-[#6EE756]' : 'bg-[#141417] border-[#2C2C35]'
              }`}
            >
              <Text 
                className={`text-[12px] font-bold tracking-wider uppercase ${
                  isActive ? 'text-[#6EE756]' : 'text-[#8A8A98]'
                }`}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
