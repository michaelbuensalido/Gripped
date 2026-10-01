const fs = require('fs');
const path = require('path');

const replacements = [
  // App surface palette
  { regex: /#1E1E24/gi, replacement: '#19191D' }, // Primary Surface
  { regex: /#131316/gi, replacement: '#111113' }, // Canvas/Base
  { regex: /#17171C/gi, replacement: '#141417' }, // Recessed/Inset
  
  // Borders
  { regex: /#2C2C35/gi, replacement: '#27272F' }, // Primary Border
  
  // Text & labels
  { regex: /#8A8A98/gi, replacement: '#9090A0' }, // Secondary
  { regex: /#555562/gi, replacement: '#555562' }, // Structural

  // Functional State Accents
  { regex: /#E8DEB5/gi, replacement: '#3E3E48' }, // Old attempt -> New Dark Slate
  { regex: /#E7AE56/gi, replacement: '#3E3E48' }, // Old attempt/alert
  { regex: /#484852/gi, replacement: '#FF453A' }, // Fail -> Alert
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

const dirs = ['./app', './components', './store', './db'];
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}

console.log('Color tokens replacement complete.');
