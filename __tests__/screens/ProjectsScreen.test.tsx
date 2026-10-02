import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProjectsScreen from '../../app/projects';

// Mock dependencies
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { text: '#000', textMuted: '#666', card: '#fff', bg: '#fff', accent: '#f00' },
    space: { lg: 20 },
    radius: { pill: 20 },
    type: { display: {}, caption: {}, body: {} },
    shadow: { floating: {} }
  })
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() })
}));
jest.mock('../../db/hooks', () => ({
  useRichProjects: () => [
    { id: '1', title: 'P1', status: 'in_progress', attempts: 5 },
    { id: '2', title: 'P2', status: 'in_progress', attempts: 3 },
    { id: '3', title: 'P3', status: 'sent', attempts: 10 }
  ]
}));

describe('ProjectsScreen', () => {
  it('renders correct caption counts', () => {
    render(<ProjectsScreen />);
    
    // 2 in progress, 1 sent, total attempts = 5 + 3 + 10 = 18
    expect(screen.getByText('2 active · 1 sent · 18 burns')).toBeTruthy();
  });
});
