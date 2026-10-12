describe('useSessionActions logic', () => {
  let sessions = [];
  let activeSession = null;

  const getActiveSession = () => activeSession;
  const insertSession = (s) => {
    sessions.push(s);
    activeSession = s;
  };

  function createTestSessionActions() {
    const isCreatingRef = { current: false };
    let pushedRoute = null;

    const startOrResume = (gymName) => {
      const active = getActiveSession();
      if (active) {
        pushedRoute = '/session/active';
        return pushedRoute;
      }

      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      insertSession({
        id: 'uuid',
        gymName: gymName || 'Local Gym',
        startTime: Date.now(),
      });

      pushedRoute = '/session/active';
      isCreatingRef.current = false;
      return pushedRoute;
    };

    return { startOrResume };
  }

  beforeEach(() => {
    sessions = [];
    activeSession = null;
  });

  it('creates session when none active', () => {
    const actions = createTestSessionActions();
    const route = actions.startOrResume('Test Gym');
    expect(sessions.length).toBe(1);
    expect(sessions[0].gymName).toBe('Test Gym');
    expect(route).toBe('/session/active');
  });

  it('resumes session when active', () => {
    const actions = createTestSessionActions();
    actions.startOrResume('Test Gym');
    const route = actions.startOrResume('Another Gym');
    expect(sessions.length).toBe(1);
    expect(route).toBe('/session/active');
  });
});
