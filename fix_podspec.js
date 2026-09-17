const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@scottjgilroy', 'react-native-vision-camera-v4-pose-detection', 'react-native-vision-camera-v4-pose-detection.podspec');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/if ENV\['RCT_NEW_ARCH_ENABLED'\] == '1' then[\s\S]*?end/g, '');

fs.writeFileSync(filePath, content);
console.log('Fixed podspec.');
