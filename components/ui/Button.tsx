import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-accent',
  secondary: 'bg-card border border-border',
  danger:    'bg-red-600',
  ghost:     'bg-transparent',
};

const textClasses: Record<Variant, string> = {
  primary:   'text-white font-bold',
  secondary: 'text-primary font-semibold',
  danger:    'text-white font-bold',
  ghost:     'text-secondary font-semibold',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-2xl',
};

const textSizeClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const variantCls = variantClasses[variant];
  const sizeCls = sizeClasses[size];
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      className={`items-center justify-center ${variantCls} ${sizeCls} ${disabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
