const fs = require('fs');
const file = fs.readFileSync('app/analytics.tsx', 'utf8');

const updated = file.replace(
  /const hasData = stats\.resultCounts\.top > 0[^]*?(?=const \{ resultCounts, avgGradeLast20)/,
  ""
).replace(
  /{!\hasData \? \([\s\S]*?\) : \(\s*<>\s*/,
  ""
).replace(
  /\n\s*<\/>\n\s*\)\}\n\s*<\/ScrollView>/,
  "\n      </ScrollView>"
);

fs.writeFileSync('app/analytics.tsx.new', updated);
console.log('Done');
