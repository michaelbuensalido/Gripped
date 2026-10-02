const fs = require('fs');
let code = fs.readFileSync('db/queries.ts', 'utf8');

code = code.replace(
  /if \(daysAgo <= 14\) \{\n\s*personalBest = \{ gradeRaw: allTimeHardestRow\.grade_raw, daysAgo \};\n\s*\}/,
  `if (daysAgo <= 14) {
        // Check if there was a previous best to beat (i.e., any climb logged before this one)
        const previousClimbs = db.getFirstSync(\`
          SELECT COUNT(*) as c FROM climbs c
          JOIN sessions s ON c.session_id = s.id
          WHERE c.logged_at < ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL
        \`, [firstTimeRow.logged_at]);
        
        if (previousClimbs && previousClimbs.c > 0) {
          personalBest = { gradeRaw: allTimeHardestRow.grade_raw, daysAgo };
        }
      }`
);

fs.writeFileSync('db/queries.ts', code);
