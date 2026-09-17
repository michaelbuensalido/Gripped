import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface ConditionChip {
  key: string;
  label: string;
}

const CONDITIONS: ConditionChip[] = [
  { key: 'fresh_skin',     label: 'Fresh Skin' },
  { key: 'greasy_holds',   label: 'Greasy Holds' },
  { key: 'crisp_friction', label: 'Crisp Friction' },
  { key: 'high_gravity',   label: 'High Gravity' },
];

interface SessionConditionStripProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function SessionConditionStrip({ selected, onChange }: SessionConditionStripProps) {
  const toggle = (key: string) => {
    triggerHaptic('light');
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8, flexDirection: 'row' }}
    >
      {CONDITIONS.map((chip) => {
        const isSelected = selected.includes(chip.key);
        return (
          <TouchableOpacity
            key={chip.key}
            onPress={() => toggle(chip.key)}
            activeOpacity={0.75}
            className={`h-[32px] px-3 rounded-lg border items-center justify-center ${
              isSelected 
                ? 'bg-[#22222A] border-[#8E7CFF]' 
                : 'bg-[#19191D] border-[#27272F]'
            }`}
          >
            <Text 
              className={`text-[12px] ${
                isSelected 
                  ? 'font-bold text-white' 
                  : 'text-[#9090A0]'
              }`}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
