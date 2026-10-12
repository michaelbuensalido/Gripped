import React from 'react';

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Platform: { OS: 'ios', select: (obj: any) => obj.ios || obj.default },
  StyleSheet: { create: (s: any) => s },
  Appearance: { getColorScheme: () => 'dark', addChangeListener: jest.fn() },
}), { virtual: true });

jest.mock('lucide-react-native', () => ({
  AlertTriangle: 'AlertTriangle',
  RotateCcw: 'RotateCcw',
}), { virtual: true });

import { GlobalErrorBoundary } from '../../components/ui/GlobalErrorBoundary';

describe('GlobalErrorBoundary', () => {
  it('renders children when no error is present', () => {
    const boundary = new GlobalErrorBoundary({ children: 'Safe Child' });
    const rendered = boundary.render();
    expect(rendered).toBe('Safe Child');
  });

  it('catches error and derives state with hasError: true', () => {
    const testError = new Error('Test crash');
    const nextState = GlobalErrorBoundary.getDerivedStateFromError(testError);
    expect(nextState).toEqual({ hasError: true, error: testError });
  });

  it('renders fallback error UI when hasError is true', () => {
    const boundary = new GlobalErrorBoundary({ children: 'Child' });
    boundary.state = {
      hasError: true,
      error: new Error('Render crash'),
      errorInfo: null,
    };

    const rendered = boundary.render() as React.ReactElement;
    expect(rendered).toBeDefined();
    expect(rendered.type).toBe('View');
  });

  it('supports Expo Router ErrorBoundary props with error and retry', () => {
    const retryFn = jest.fn();
    const testError = new Error('Route crash');
    const boundary = new GlobalErrorBoundary({ error: testError, retry: retryFn });

    expect(boundary.state.hasError).toBe(true);
    expect(boundary.state.error).toBe(testError);

    boundary.setState = jest.fn((patch: any) => {
      boundary.state = { ...boundary.state, ...patch };
    });

    boundary.handleTryAgain();
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(boundary.state.hasError).toBe(false);
  });

  it('resets error state on handleRestart fallback', async () => {
    const retryFn = jest.fn();
    const boundary = new GlobalErrorBoundary({
      children: 'Content',
      error: new Error('Crash'),
      retry: retryFn,
    });

    boundary.setState = jest.fn((patch: any) => {
      boundary.state = { ...boundary.state, ...patch };
    });

    await boundary.handleRestart();
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });
});
