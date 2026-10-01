const fs = require('fs');
let code = fs.readFileSync('db/queries.ts', 'utf8');

// Ensure getDatabase is imported
if (!code.includes('import { getDatabase')) {
  code = "import { getDatabase } from './schema';\n" + code;
}

// Fix duplicate getGradePyramid
// The first one is around line 286 (the old mock or session pyramid)
// The new one is around line 655
// Let's replace the old one with a stub or rename the new one, but wait, we can just remove the old one.
const oldPyramidRegex = /export function getGradePyramid\(sessionId: string \| null, sinceTimestamp\?: number\): any\[\] \{[\s\S]*?\n\}\n/m;
code = code.replace(oldPyramidRegex, '');

fs.writeFileSync('db/queries.ts', code);
console.log('Fixed queries.ts');
