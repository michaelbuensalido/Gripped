const fs = require('fs');
let layout = fs.readFileSync('app/_layout.tsx', 'utf8');

layout = layout.replace(/options=\{\{ href: null \}\}/g, 'options={{ href: null, animation: "none" as any }}');
layout = layout.replace(/options=\{\{ title: "Gallery", href: null \}\}/g, 'options={{ title: "Gallery", href: null, animation: "none" as any }}');

fs.writeFileSync('app/_layout.tsx', layout);
