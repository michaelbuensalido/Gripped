const fs = require('fs');
let code = fs.readFileSync('components/ui/StatTile.tsx', 'utf8');

code = code.replace(
  /return \([\s\S]*?\);/,
  `return (
    <Card variant="muted" style={{ ...(flex ? { flex: 1 } : {}), padding: space.sm, alignItems: 'flex-start' }}>
      <Text style={[{ color: colors.text, marginBottom: 2, fontSize: 24 }, type.stat]}>{value}</Text>
      <Text style={[{ color: colors.textMuted }, type.label]} numberOfLines={1}>{label}</Text>
      <View style={{ height: 16, marginTop: 2, justifyContent: 'center' }}>
        {trend ? <Text style={[{ color: colors.flashText }, type.caption]}>{trend}</Text> : null}
      </View>
    </Card>
  );`
);

fs.writeFileSync('components/ui/StatTile.tsx', code);
