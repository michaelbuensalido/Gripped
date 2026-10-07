const fs = require('fs');

let layout = fs.readFileSync('app/_layout.tsx', 'utf8');

if (!layout.includes('animation: "shift"')) {
  layout = layout.replace(
    /sceneStyle: \{ backgroundColor: "transparent" \},/,
    `sceneStyle: { backgroundColor: "transparent" },\n        animation: "shift",`
  );
  fs.writeFileSync('app/_layout.tsx', layout);
}
