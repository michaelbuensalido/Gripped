const fs = require('fs');
let content = fs.readFileSync('store/sessionStore.ts', 'utf8');

content = content.replace(
  "logGenericAscent: (payload: any) => string;",
  "logGenericAscent: (payload: any) => string;\n  undoLastClimb: () => void;"
);

const undoMethod = `
  undoLastClimb: () => {
    const activeSession = Q.getActiveSession();
    if (!activeSession) return;
    const db = require('../db/schema').getDatabase();
    
    // Find the most recent climb for this session
    const lastClimb = db.getFirstSync("SELECT id, project_id FROM climbs WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1", [activeSession.id]);
    
    if (lastClimb) {
      db.runSync("UPDATE climbs SET deleted_at = ? WHERE id = ?", [Date.now(), lastClimb.id]);
      
      // If it was a project climb, we also need to update the project status appropriately, but for MVP soft-deleting the climb is sufficient to undo it from the session stats
      require('../db/events').dbEvents.emit();
    }
  },
`;

content = content.replace("logGenericAscent: (payload) => {", undoMethod + "\n  logGenericAscent: (payload) => {");

fs.writeFileSync('store/sessionStore.ts', content);
