const fs = require('fs');

const files = [
  'app/index.tsx',
  'app/projects.tsx',
  'app/explore.tsx',
  'app/analytics.tsx',
  'app/profile.tsx',
  'app/project/[id].tsx',
  'app/gym/[id].tsx',
  'app/session/detail/[id].tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  if (code.includes('PageTransition')) continue;

  // 1. Add import
  const depth = file.split('/').length - 2;
  const path = depth === 0 ? '../components/ui/PageTransition' : '../../components/ui/PageTransition';
  
  // Note: app/index.tsx etc have depth=0 relative to app/
  
  code = code.replace(
    /import React(.*?);/,
    `import React$1;\nimport { PageTransition } from '${path}';`
  );

  // 2. Replace root View
  // We look for the FIRST `<View style={{ flex: 1` that occurs after `return (`
  // This is tricky. We'll use a replacer function.

  let returnFound = false;
  let replaced = false;

  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (')) {
      returnFound = true;
    }
    
    if (returnFound && !replaced && lines[i].includes('<View style={{ flex: 1')) {
      lines[i] = lines[i].replace('<View', '<PageTransition');
      replaced = true;
    }
  }

  // 3. Replace the corresponding closing tag. 
  // Since we replaced the first <View> after return (, it's likely the very last </View> before the final ); }
  
  if (replaced) {
    let lastViewIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('</View>')) {
        lastViewIdx = i;
        break;
      }
    }
    if (lastViewIdx !== -1) {
      lines[lastViewIdx] = lines[lastViewIdx].replace('</View>', '</PageTransition>');
    }
  }

  fs.writeFileSync(file, lines.join('\n'));
}
