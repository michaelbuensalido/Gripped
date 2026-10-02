const fs = require('fs');

const replacement = `export function getRecentGrades(): { gradeRaw: string, gradeIndex: number }[] {
  const db = getDatabase();
  
  const recentRows = db.getAllSync(\`
    SELECT grade_raw, grade_index, MAX(logged_at) as last_logged
    FROM climbs 
    WHERE deleted_at IS NULL
    GROUP BY grade_raw, grade_index
    ORDER BY last_logged DESC
    LIMIT 5
  \`);
  
  const recentGrades = recentRows.map(r => ({ gradeRaw: r.grade_raw, gradeIndex: r.grade_index }));
  
  if (recentGrades.length === 5) {
    return recentGrades.sort((a, b) => a.gradeIndex - b.gradeIndex);
  }

  const allClimbs = db.getAllSync(\`
    SELECT grade_index FROM climbs WHERE deleted_at IS NULL ORDER BY grade_index ASC
  \`);
  
  let medianIndex = 2; // Default to V2 if no climbs
  if (allClimbs.length > 0) {
    const mid = Math.floor(allClimbs.length / 2);
    medianIndex = allClimbs[mid].grade_index;
  }
  
  const fillCandidates = [
    medianIndex,
    medianIndex + 1,
    medianIndex - 1,
    medianIndex + 2,
    medianIndex - 2,
  ];
  
  const resultMap = new Map();
  for (const g of recentGrades) {
    resultMap.set(g.gradeIndex, g.gradeRaw);
  }
  
  for (const idx of fillCandidates) {
    if (resultMap.size >= 5) break;
    if (idx >= 0 && !resultMap.has(idx)) {
      resultMap.set(idx, \`V\${idx}\`);
    }
  }
  
  let fallbackIdx = 0;
  while (resultMap.size < 5 && fallbackIdx < 17) {
    if (!resultMap.has(fallbackIdx)) {
      resultMap.set(fallbackIdx, \`V\${fallbackIdx}\`);
    }
    fallbackIdx++;
  }
  
  const finalGrades = Array.from(resultMap.entries()).map(([index, raw]) => ({
    gradeIndex: index,
    gradeRaw: raw
  }));
  
  return finalGrades.sort((a, b) => a.gradeIndex - b.gradeIndex);
}`;

let code = fs.readFileSync('db/queries.ts', 'utf8');
code = code.replace(/export function getRecentGrades\(\):[\s\S]*?return finalGrades\.sort\(\(a, b\) => a\.gradeIndex - b\.gradeIndex\);\n\}|export function getRecentGrades\(\):[\s\S]*?return rows\.map\(r => \(\{ gradeRaw: r\.grade_raw, gradeIndex: r\.grade_index \}\)\);\n\}/, replacement);
fs.writeFileSync('db/queries.ts', code);
