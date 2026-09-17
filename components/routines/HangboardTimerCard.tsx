import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface HangPreset {
  id: string;
  label: string;
  hangSeconds: number;
  restSeconds: number;
  sets: number;
  description: string;
}

const PRESETS: HangPreset[] = [
  {
    id: 'repeaters',
    label: 'Repeaters',
    hangSeconds: 7,
    restSeconds: 3,
    sets: 6,
    description: '7s on / 3s off × 6',
  },
  {
    id: 'max_hangs',
    label: 'Max Hangs',
    hangSeconds: 10,
    restSeconds: 180,
    sets: 5,
    description: '10s hang / 3m rest',
  },
];

type TimerPhase = 'idle' | 'hang' | 'rest' | 'done';

export function HangboardTimerCard() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<TimerPhase>('idle');
  const countdownRef = useRef(0);
  const setRef = useRef(0);

  const preset = PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startHang = useCallback(
    (setNumber: number) => {
      phaseRef.current = 'hang';
      setRef.current = setNumber;
      countdownRef.current = preset.hangSeconds;

      setPhase('hang');
      setCurrentSet(setNumber);
      setCountdown(preset.hangSeconds);
      triggerHaptic('success');

      intervalRef.current = setInterval(() => {
        countdownRef.current -= 1;
        setCountdown(countdownRef.current);

        if (countdownRef.current <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          const isLastSet = setRef.current >= preset.sets;
          if (isLastSet) {
            phaseRef.current = 'done';
            setPhase('done');
            triggerHaptic('success');
          } else {
            startRest(setRef.current);
          }
        }
      }, 1000);
    },
    [preset]
  );

  const startRest = useCallback(
    (afterSet: number) => {
      phaseRef.current = 'rest';
      countdownRef.current = preset.restSeconds;

      setPhase('rest');
      setCountdown(preset.restSeconds);
      triggerHaptic('light');

      intervalRef.current = setInterval(() => {
        countdownRef.current -= 1;
        setCountdown(countdownRef.current);

        if (countdownRef.current <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          startHang(afterSet + 1);
        }
      }, 1000);
    },
    [preset, startHang]
  );

  const handleStart = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startHang(1);
  }, [startHang]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    phaseRef.current = 'idle';
    setPhase('idle');
    setCountdown(0);
    setCurrentSet(0);
    triggerHaptic('light');
  }, []);

  const handleSelectPreset = (id: string) => {
    if (phase !== 'idle') handleReset();
    setSelectedPresetId(id);
    triggerHaptic('light');
  };

  const phaseColor =
    phase === 'hang' ? '#6EE756' :
    phase === 'rest' ? '#8E7CFF' :
    phase === 'done' ? '#6EE756' : '#FFFFFF';

  let statusTitle = 'Ready';
  if (phase === 'hang') statusTitle = `HANG: ${countdown}s`;
  else if (phase === 'rest') statusTitle = `REST: ${countdown}s`;
  else if (phase === 'done') statusTitle = 'DONE ✓';

  let statusSubtitle = `${preset.sets} sets total`;
  if (phase !== 'idle' && phase !== 'done') {
    statusSubtitle = `Set ${currentSet} / ${preset.sets}`;
  }

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mb-6">
      {/* Section Header */}
      <View>
        <Text className="text-[#9090A0] text-[11px] font-bold tracking-[1.5px] uppercase">HANGBOARD PROTOCOL</Text>
        <Text className="text-[#555562] text-[12px]">Finger endurance & recruitment</Text>
      </View>

      {/* Preset Toggles */}
      <View className="flex-row gap-2.5 my-3">
        {PRESETS.map((p) => {
          const isActive = p.id === selectedPresetId;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => handleSelectPreset(p.id)}
              activeOpacity={0.8}
              className={`flex-1 p-2 rounded-lg bg-[#141417] ${isActive ? 'border-[1.5px] border-[#6EE756]' : 'border border-[#27272F]'}`}
            >
              <Text className="text-white text-[13px] font-bold">{p.label}</Text>
              <Text className="text-[#9090A0] text-[11px]" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {p.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timer Trigger Bar */}
      <View className="flex-row items-center justify-between pt-2 border-t border-[#22222A]">
        <View>
          <Text className="text-[16px] font-bold" style={{ color: phaseColor }}>{statusTitle}</Text>
          <Text className="text-[#9090A0] text-[12px]" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            {statusSubtitle}
          </Text>
        </View>

        {phase === 'idle' || phase === 'done' ? (
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.8}
            className="h-[42px] px-6 bg-[#6EE756] rounded-lg items-center justify-center"
          >
            <Text className="text-[#111113] text-[13px] font-bold uppercase">{phase === 'done' ? 'REPEAT' : 'START'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.8}
            className="h-[42px] px-6 bg-[#141417] border border-[#27272F] rounded-lg items-center justify-center"
          >
            <Text className="text-[#8A8A98] text-[13px] font-bold uppercase">RESET</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
