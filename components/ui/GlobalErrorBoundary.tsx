import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { colors, space, radius, type } from '../../theme/tokens';

interface Props {
  children?: ReactNode;
  error?: Error;
  retry?: () => void | Promise<void>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: Boolean(props.error),
      error: props.error || null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Production telemetry or diagnostic logging (guarded)
    if (__DEV__) {
      console.warn('[GlobalErrorBoundary] Caught render error:', error, errorInfo);
    }
  }

  handleRestart = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        window.location.reload();
        return;
      }
      // Dynamically attempt reloadAsync if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const updatesModule = require('expo-updates');
        if (updatesModule?.reloadAsync) {
          await updatesModule.reloadAsync();
          return;
        }
      } catch {
        // Module not linked or dev client
      }
    } catch {
      // Fallback
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.retry) {
      this.props.retry();
    }
  };

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.retry) {
      this.props.retry();
    }
  };

  render() {
    const activeError = this.props.error || this.state.error;
    if (this.state.hasError || Boolean(this.props.error)) {
      return (
        <View style={styles.container}>
          <View style={styles.backdropGlow} pointerEvents="none" />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={32} color={colors.accent} />
              </View>

              <Text style={[type.title, styles.title]}>Something went wrong</Text>
              
              <Text style={[type.body, styles.description]}>
                CruxLog encountered an unexpected issue. Your climbing data and session history are safely stored in your local SQLite database.
              </Text>

              {__DEV__ && activeError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={4}>
                    {activeError.toString()}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleRestart}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={18} color={colors.textOnAccent} style={{ marginRight: space.sm }} />
                  <Text style={styles.primaryButtonText}>Restart CruxLog</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.handleTryAgain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTexture,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropGlow: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(142, 124, 255, 0.08)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.xl,
    width: '100%',
    maxWidth: 440,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: space.sm,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: space.xl,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.xl,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  actions: {
    width: '100%',
    gap: space.md,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: space.md,
    borderRadius: radius.xl,
  },
  primaryButtonText: {
    color: colors.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.md,
    borderRadius: radius.xl,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
