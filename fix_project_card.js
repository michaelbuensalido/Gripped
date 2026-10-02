const fs = require('fs');
let code = fs.readFileSync('components/ui/ProjectCard.tsx', 'utf8');

const newProps = `export function ProjectCard({ 
  project, 
  onLogAttempt,
  onArchive,
  variant = 'default',
  style,
}: { 
  project: any; 
  onLogAttempt?: () => void;
  onArchive?: () => void;
  variant?: 'default' | 'compact';
  style?: any;
}) {`;

code = code.replace(/export function ProjectCard\(\{[\s\S]*?\}\) \{/, newProps);

const newCardContent = `
  const cardContent = (
    <View testID={\`project-card-\${project.title.replace(/\\s+/g, '-')}\`} style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: variant === 'compact' ? space.md : space.lg, marginBottom: variant === 'compact' ? 0 : space.lg }, shadow.card, style]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md, gap: space.md }}>
        <GradePill gradeIndex={project.normalizedDifficulty ?? project.grade_index ?? 0} label={project.gradeRaw ?? project.grade_raw ?? '—'} />
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { color: colors.text }]} numberOfLines={1}>
            {project.title}
          </Text>
          {project.gymName && (
            <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
              {project.gymName}
            </Text>
          )}
        </View>
        {variant !== 'compact' && project.statusChip && (
          <View style={{ backgroundColor: colors.cardMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm }}>
            <Text style={[type.caption, { color: colors.text }]}>{project.statusChip}</Text>
          </View>
        )}
      </View>

      {variant === 'compact' ? (
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <View>
            <Text style={[type.caption, { color: colors.textMuted, marginBottom: 2 }]}>BURNS</Text>
            <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>{project.attempts || 0}</Text>
          </View>
          {(project.highWaterMarkMoves ?? project.high_water_mark_moves) ? (
            <View>
              <Text style={[type.caption, { color: colors.textMuted, marginBottom: 2 }]}>LINKED</Text>
              <Text style={[type.heading, { color: colors.text, fontSize: 14 }]}>
                {project.highWaterMarkMoves ?? project.high_water_mark_moves}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          {/* Tags */}
          {(project.wallAngle || project.holdType) && (
            <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
              {project.wallAngle && <Chip label={project.wallAngle} />}
              {project.holdType && <Chip label={project.holdType} />}
            </View>
          )}

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: space.lg, marginBottom: space.md, alignItems: 'flex-end' }}>
            <View>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>BURNS</Text>
              <Text style={[type.heading, { color: colors.text }]}>{project.attempts || 0}</Text>
            </View>
            <View>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>HIGH-WATER</Text>
              <Text style={[type.heading, { color: colors.text }]}>
                {project.highWaterMarkMoves ? \`\${project.highWaterMarkMoves} moves\` : 'None'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>LAST TRIED</Text>
              <Text style={[type.body, { color: colors.text }]}>{getRelativeTime(project.lastTriedAt)}</Text>
            </View>
            {project.burnsPerSession && project.burnsPerSession.length > 0 && (
              <Sparkline data={project.burnsPerSession} />
            )}
          </View>

          {/* Notes */}
          {project.microBeta && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7} style={{ marginBottom: space.md }}>
              <Text style={[type.body, { color: colors.textMuted }]} numberOfLines={expanded ? undefined : 2}>
                {project.microBeta}
              </Text>
            </TouchableOpacity>
          )}

          {/* Action */}
          <View style={{ alignItems: 'flex-start', marginTop: space.sm }}>
            <SecondaryButton label="Log Attempt" onPress={onLogAttempt!} />
          </View>
        </>
      )}
    </View>
  );

  if (variant === 'compact') return cardContent;
`;

code = code.replace(/<Swipeable[\s\S]*?<\/Swipeable>/, `
    <Swipeable 
      ref={swipeableRef}
      renderLeftActions={renderLeftActions} 
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      {cardContent}
    </Swipeable>
`);

// Insert the definition of cardContent right before the return <Swipeable...> statement
code = code.replace(/return \(\s*<Swipeable/, newCardContent + "\n  return (\n    <Swipeable");

fs.writeFileSync('components/ui/ProjectCard.tsx', code);
