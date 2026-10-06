const fs = require('fs');

// Patch Card.tsx
let cardContent = fs.readFileSync('components/ui/Card.tsx', 'utf8');
cardContent = cardContent.replace(/import \{ BlurView \} from 'expo-blur';\n/, '');
cardContent = cardContent.replace(/\{Platform\.OS !== 'web' \? <BlurView[\s\S]*?\/> : <View style=\{\[StyleSheet\.absoluteFill, \{ backgroundColor: 'rgba\(255, 255, 255, 0\.05\)' \}\]\} \/>\}/g, '<View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]} />');
fs.writeFileSync('components/ui/Card.tsx', cardContent);

// Patch _layout.tsx
let layoutContent = fs.readFileSync('app/_layout.tsx', 'utf8');
layoutContent = layoutContent.replace(/import \{ LinearGradient \} from "expo-linear-gradient";\n/, '');
layoutContent = layoutContent.replace(/\{Platform\.OS !== 'web' \? \([\s\S]*?<LinearGradient[\s\S]*?\/>\n\s*\) : \(\n\s*<View pointerEvents="none" style=\{\[StyleSheet\.absoluteFill, \{ backgroundColor: colors\.backdropScrimBottom, opacity: 0\.8 \}\]\} \/>\n\s*\)\}/g, '<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdropScrimBottom, opacity: 0.8 }]} />');
fs.writeFileSync('app/_layout.tsx', layoutContent);

