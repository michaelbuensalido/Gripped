import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface PrimaryButtonProps {
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  onPress: () => void;
}

export function PrimaryButton({ label, icon, loading, onPress }: PrimaryButtonProps) {
  const { colors, radius, type } = useTheme();

  return (
    <TouchableOpacity
      onPress={loading ? undefined : onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.accent,
        height: 52,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[{ color: colors.textOnAccent, fontFamily: type.heading.fontFamily, fontSize: type.heading.fontSize }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
