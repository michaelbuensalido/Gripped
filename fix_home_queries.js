const fs = require('fs');
let code = fs.readFileSync('db/queries.ts', 'utf8');

// Fix thisWeekClimbs
code = code.replace(
  /SELECT \* FROM climbs \n    WHERE logged_at >= \? AND logged_at <= \? AND deleted_at IS NULL/,
  `SELECT c.* FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.logged_at >= ? AND c.logged_at <= ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL`
);

// Fix hardest30dRow
code = code.replace(
  /SELECT grade_raw, grade_index FROM climbs \n    WHERE logged_at >= \? AND deleted_at IS NULL AND \(result = 'send' OR result = 'top' OR result = 'flash'\)/,
  `SELECT c.grade_raw, c.grade_index FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.logged_at >= ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')`
);

// Fix allTimeHardestRow
code = code.replace(
  /SELECT grade_raw, grade_index FROM climbs \n    WHERE deleted_at IS NULL AND \(result = 'send' OR result = 'top' OR result = 'flash'\)/,
  `SELECT c.grade_raw, c.grade_index FROM climbs c
    JOIN sessions s ON c.session_id = s.id
    WHERE c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')`
);

// Fix firstTimeRow
code = code.replace(
  /SELECT logged_at FROM climbs \n      WHERE grade_index = \? AND deleted_at IS NULL AND \(result = 'send' OR result = 'top' OR result = 'flash'\)/,
  `SELECT c.logged_at FROM climbs c
      JOIN sessions s ON c.session_id = s.id
      WHERE c.grade_index = ? AND c.deleted_at IS NULL AND s.deleted_at IS NULL AND (c.result = 'send' OR c.result = 'top' OR c.result = 'flash')`
);

fs.writeFileSync('db/queries.ts', code);
