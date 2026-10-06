const fs = require('fs');
let content = fs.readFileSync('components/ui/Card.tsx', 'utf8');

content = content.replace("import { BlurView } from 'expo-blur';", "import { BlurView } from 'expo-blur';\nimport { Platform } from 'react-native';");

// Use conditional rendering for BlurView
const blurJSX = `{Platform.OS !== 'web' ? <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />}`;

content = content.replace(/<BlurView intensity=\{20\} tint="dark" style=\{StyleSheet.absoluteFill\} \/>/g, blurJSX);

fs.writeFileSync('components/ui/Card.tsx', content);
