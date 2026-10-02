const assert = require('assert');

let sessions = [];
let activeSession = null;

const getActiveSession = () => activeSession;
const insertSession = (s) => {
  sessions.push(s);
  activeSession = s;
};

// Hook implementation (simplified version of useSessionActions for logic test)
function useSessionActionsTest() {
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
      startTime: Date.now()
    });
    
    pushedRoute = '/session/active';
    isCreatingRef.current = false;
    return pushedRoute;
  };
  
  return { startOrResume };
}

console.log('Testing useSessionActions hook logic:');

// Test 1
sessions = [];
activeSession = null;
const actions1 = useSessionActionsTest();
let route = actions1.startOrResume('Test Gym');
assert.equal(sessions.length, 1);
assert.equal(sessions[0].gymName, 'Test Gym');
assert.equal(route, '/session/active');
console.log('✅ Creates session when none active');

// Test 2
route = actions1.startOrResume('Another Gym');
assert.equal(sessions.length, 1);
assert.equal(route, '/session/active');
console.log('✅ Resumes session when active');

console.log('All hook tests passed ✅');
