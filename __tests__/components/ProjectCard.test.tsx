import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProjectCard } from '../../components/ui/ProjectCard';
import { useTheme } from '../../theme/useTheme';

// Mock theme hook and router
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { text: '#000', textMuted: '#666', card: '#fff', cardMuted: '#eee', accent: '#f00' },
    space: { md: 16, sm: 8 },
    radius: { lg: 12, sm: 4 },
    type: { heading: {}, caption: {} },
    shadow: { card: {} }
  })
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('ProjectCard', () => {
  it('renders informative status chip', () => {
    const project = {
      id: '1',
      title: 'Cave Roof',
      statusChip: 'Working'
    };
    render(<ProjectCard project={project} />);
    expect(screen.getByText('Working')).toBeTruthy();
  });

  it('hides "Not started" status chip', () => {
    const project = {
      id: '1',
      title: 'Cave Roof',
      statusChip: 'Not started'
    };
    render(<ProjectCard project={project} />);
    expect(screen.queryByText('Not started')).toBeNull();
  });

  it('renders line 3 with 0 burns correctly', () => {
    const project = {
      id: '1',
      title: 'Cave Roof',
      attempts: 0
    };
    render(<ProjectCard project={project} />);
    expect(screen.getByText('No attempts yet')).toBeTruthy();
  });

  it('renders line 3 with attempts correctly', () => {
    const project = {
      id: '1',
      title: 'Cave Roof',
      attempts: 12,
      highWaterMarkMoves: 6
    };
    render(<ProjectCard project={project} />);
    // Testing that the "12 burns · 6 moves linked" substring exists
    // Text components with nested strings might render as one node in RTL
    const el = screen.getByText(/12 burns.*6 moves linked/);
    expect(el).toBeTruthy();
  });
});
