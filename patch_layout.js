const fs = require('fs');
const file = 'app/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace DB import
content = content.replace(
  /import \{ initializeDatabase \} from '\.\.\/db\/schema';/,
  "import { initDatabase } from '../services/database';"
);

// Add state to RootLayout
content = content.replace(
  /export default function RootLayout\(\) \{/,
  "export default function RootLayout() {\n  const [isDbReady, setIsDbReady] = React.useState(false);"
);

// Update useEffect
const oldUseEffect = `  useEffect(() => {
    initializeDatabase()
      .then(() => {
        useSessionStore.getState().initActiveSession();
      })
      .catch(console.error);
  }, []);`;

const newUseEffect = `  useEffect(() => {
    try {
      initDatabase();
      setIsDbReady(true);
    } catch (e) {
      console.error(e);
    }
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// Block rendering
content = content.replace(
  /<TabLayout \/>/g,
  "{isDbReady ? <TabLayout /> : null}"
);

// Remove ActiveSessionMiniBar since we broke its props or it might crash if relying on old store? 
// Wait, better to just let it mount but we'll check its usage.
fs.writeFileSync(file, content);
