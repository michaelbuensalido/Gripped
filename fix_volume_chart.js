const fs = require('fs');
let code = fs.readFileSync('components/ui/VolumeChart.tsx', 'utf8');

code = code.replace(
  /export interface VolumeChartProps \{[\s\S]*?\}/,
  `export interface VolumeChartProps {
  data: { weekLabel: string; climbs: number; isCurrent: boolean }[];
  onPress?: () => void;
}`
);

code = code.replace(
  /export function VolumeChart\(\{ data, changePercent, onPress \}: VolumeChartProps\) \{/,
  `export function VolumeChart({ data, onPress }: VolumeChartProps) {`
);

code = code.replace(
  /const changeLabel = [\s\S]*?colors\.textMuted;/,
  `const currentWeek = data[data.length - 1] || { climbs: 0 };
  const lastWeek = data[data.length - 2] || { climbs: 0 };
  const diff = currentWeek.climbs - lastWeek.climbs;

  let changeLabel = 'Same as last week';
  let changeColor = colors.textMuted;

  if (lastWeek.climbs === 0) {
    changeLabel = 'First week logged';
  } else if (diff > 0) {
    changeLabel = \`↑ \${diff} climbs vs last week\`;
    changeColor = colors.flashText;
  } else if (diff < 0) {
    changeLabel = \`↓ \${Math.abs(diff)} climbs vs last week\`;
    changeColor = colors.dangerText;
  }`
);

// We also need to add the climb count above the current week's bar.
// Currently the height is MAX_BAR_HEIGHT + 24. Let's make it MAX_BAR_HEIGHT + 40 to have space for the count.
code = code.replace(
  /height: MAX_BAR_HEIGHT \+ 24/,
  "height: MAX_BAR_HEIGHT + 40"
);

code = code.replace(
  /<View style=\{\{\n\s*height: h, width: '100%',\n\s*backgroundColor: item\.isCurrent \? colors\.accent : colors\.cardMuted,\n\s*borderTopLeftRadius: radius\.sm, borderTopRightRadius: radius\.sm,\n\s*\}\} \/>/g,
  `{item.isCurrent && (
                  <Text style={[type.caption, { color: colors.text, fontSize: 10, marginBottom: 2, textAlign: 'center' }]}>{item.climbs}</Text>
                )}
                <View style={{
                  height: h, width: '100%',
                  backgroundColor: item.isCurrent ? colors.accent : colors.cardMuted,
                  borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm,
                }} />`
);

code = code.replace(
  /\{item\.weekLabel\}\n\s*<\/Text>/,
  `{i % 2 === 1 || item.isCurrent ? item.weekLabel : ''}
              </Text>`
);

fs.writeFileSync('components/ui/VolumeChart.tsx', code);
