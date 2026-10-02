const fs = require('fs');
let code = fs.readFileSync('components/ui/SessionRow.tsx', 'utf8');

code = code.replace(
  /export interface SessionRowProps \{[\s\S]*?\}/,
  `export interface SessionRowProps {
  id: string;
  gymName: string;
  startedAt: number;
  durationMs: number;
  climbs?: number;
  sends?: number;
  hardestGrade?: string;
  isLast?: boolean;
}`
);

code = code.replace(
  /export function SessionRow\(\{ id, gymName, startedAt, durationMs, hardestGrade, isLast \}: SessionRowProps\) \{/,
  `export function SessionRow({ id, gymName, startedAt, durationMs, climbs, sends, hardestGrade, isLast }: SessionRowProps) {`
);

code = code.replace(
  /\{dateStr\} • \{durationStr\}/,
  `{dateStr} • {durationStr}{climbs !== undefined ? \` • \${climbs} climb\${climbs !== 1 ? 's' : ''}\` : ''}{sends !== undefined ? \` • \${sends} send\${sends !== 1 ? 's' : ''}\` : ''}`
);

code = code.replace(
  /\{hardestGrade && \([\s\S]*?\}\)/,
  `{hardestGrade && hardestGrade !== '–' && (
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={[type.caption, { color: colors.textMuted, fontSize: 10, marginBottom: 2 }]}>Hardest</Text>
             <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>{hardestGrade}</Text>
          </View>
        )}`
);

fs.writeFileSync('components/ui/SessionRow.tsx', code);
