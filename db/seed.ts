import { getDatabase } from './schema';
import { clearAllSessionData, insertSession, finishSession, createProject, logClimbForSession, updateSessionNotesAndEffort } from './queries';
import { ProjectStatus } from '../types';

export function seedDemoData() {
  const originalDateNow = Date.now;
  try {
    let seedState = 12345;
    function random() {
      seedState |= 0;
      seedState = seedState + 0x6D2B79F5 | 0;
      let t = Math.imul(seedState ^ seedState >>> 15, 1 | seedState);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    const now = originalDateNow();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;
    
    const db = getDatabase();
    db.runSync(`DELETE FROM climbs`);
    db.runSync(`DELETE FROM sessions`);
    db.runSync(`DELETE FROM outbox`);
    db.runSync(`DELETE FROM projects`);

    const gyms = ['Boulder Co', 'The Climbing Hangar', 'Outdoor / Other'];
    
    const projectsData = [
      { title: 'Blue Arete', gradeRaw: 'V4', status: 'sent', burns: 4, sessions: 2 },
      { title: 'The Pinch', gradeRaw: 'V5', status: 'sent', burns: 7, sessions: 3 },
      { title: 'Cave Roof', gradeRaw: 'V6', status: 'sent', burns: 14, sessions: 5 },
      { title: 'Slab Master', gradeRaw: 'V5', status: 'in_progress', burns: 6, sessions: 2, hm: 5 },
      { title: 'Dyno City', gradeRaw: 'V6', status: 'in_progress', burns: 12, sessions: 4, hm: 3 },
      { title: 'Crimpy Traverse', gradeRaw: 'V7', status: 'in_progress', burns: 15, sessions: 5, hm: 6 },
      { title: 'The Project', gradeRaw: 'V8', status: 'in_progress', burns: 25, sessions: 8, hm: 8 },
    ];
    
    const projIds: any = {};
    
    projectsData.forEach((p, i) => {
      Date.now = () => now - (12 - i) * MS_PER_WEEK;
      const pid = createProject({
        title: p.title,
        gradeRaw: p.gradeRaw,
        normalizedDifficulty: parseInt(p.gradeRaw.replace('V', '')) || 5,
        wallAngle: 'overhang',
        holdType: 'crimps',
        status: p.status as ProjectStatus,
        highWaterMarkMoves: p.hm || 1,
        totalMoves: 10,
        
      });
      projIds[p.title] = pid;
    });

    let currentMedian = 2;
    let currentHardest = 3;
    
    for (let w = 9; w >= 0; w--) {
      if (w === 7 || w === 3) continue; // skipped weeks
      
      const sessionsThisWeek = 2 + Math.floor(random() * 2);
      
      currentMedian += 0.2;
      if (w === 5) currentHardest = 4;
      if (w === 2) currentHardest = 5;
      if (w === 0) currentHardest = 6;

      for (let s = 0; s < sessionsThisWeek; s++) {
        const daysAgo = w * 7 + (3 * s) + Math.floor(random() * 2);
        const sessionDate = now - daysAgo * MS_PER_DAY;
        
        Date.now = () => sessionDate;
        const sessionId = `sess_${sessionDate}`;
        const gym = gyms[Math.floor(random() * gyms.length)];
        
        insertSession({
          id: sessionId,
          gymName: gym,
          startTime: sessionDate,
          notes: ''
        });
        
        const numClimbs = 8 + Math.floor(random() * 10);
        for (let c = 0; c < numClimbs; c++) {
          const climbTime = sessionDate + c * 5 * 60 * 1000;
          Date.now = () => climbTime;
          
          let gradeNum = Math.floor(currentMedian + (random() * 3 - 1));
          if (gradeNum < 0) gradeNum = 0;
          if (gradeNum > currentHardest) gradeNum = currentHardest;
          
          let res = 'top';
          const r = random();
          if (r < 0.2) res = 'flash';
          else if (r > 0.7) res = 'attempt';
          
          logClimbForSession(sessionId, {
            gradeRaw: `V${gradeNum}`,
            result: res,
            attempts: res === 'flash' ? 1 : 1 + Math.floor(random() * 4),
            loggedAt: climbTime
          });
        }
        
        if (random() > 0.3) {
          Date.now = () => sessionDate + numClimbs * 5 * 60 * 1000;
          const p = projectsData[Math.floor(random() * projectsData.length)];
          const pid = projIds[p.title];
          const isSend = p.status === 'sent' && w === 0 && s === sessionsThisWeek - 1;
          
          logClimbForSession(sessionId, {
            gradeRaw: p.gradeRaw,
            result: isSend ? 'top' : 'attempt',
            attempts: isSend ? 1 : 3,
            projectId: pid,
            loggedAt: Date.now()
          });
        }
        
        Date.now = () => sessionDate + 2 * 60 * 60 * 1000;
        finishSession(sessionId, Date.now());
        
        if (random() > 0.5) {
          updateSessionNotesAndEffort(sessionId, 'Felt good today. ' + (random() > 0.5 ? 'Fingers were a bit tweaked.' : 'Good energy.'), 3 + Math.floor(random() * 3));
        }
      }
    }
  } finally {
    Date.now = originalDateNow;
  }
}
