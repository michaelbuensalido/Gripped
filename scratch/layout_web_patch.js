const fs = require('fs');
let content = fs.readFileSync('app/_layout.tsx', 'utf8');

content = content.replace("import { LinearGradient } from \"expo-linear-gradient\";", "import { LinearGradient } from \"expo-linear-gradient\";\nimport { Platform } from 'react-native';");

// Use conditional rendering for LinearGradient
const lgJSX = `{Platform.OS !== 'web' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.backdropScrimTop, colors.backdropScrimBottom]}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdropScrimBottom, opacity: 0.8 }]} />
      )}`;

content = content.replace(/<LinearGradient[\s\S]*?\/>/, lgJSX);

fs.writeFileSync('app/_layout.tsx', content);
