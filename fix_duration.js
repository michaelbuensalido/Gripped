const fs = require('fs');
const glob = require('glob');

const files = [
  'app/index.tsx',
  'app/session/index.tsx',
  'app/session/detail/[id].tsx',
  'app/session/summary.tsx',
  'components/ui/FloatingTabBar.tsx',
  'components/session/ShareWorkoutCard.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(
      /const totalSecs = Math\.floor\(ms \/ 1000\);/g,
      "const totalSecs = Math.floor(ms / 1000);\n  if (totalSecs < 60) return '<1 min';"
    );
    fs.writeFileSync(file, code);
  }
}
