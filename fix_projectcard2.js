const fs = require('fs');
let code = fs.readFileSync('components/ui/ProjectCard.tsx', 'utf8');

code = code.replace(/const swipeableRef = useRef[\s\S]*?\}\n/m, `const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const opacity = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={{
          width: 80,
          backgroundColor: colors.accent,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
          marginBottom: space.lg,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onLogAttempt!();
        }}
        accessibilityRole="button"
        accessibilityLabel="Log attempt"
      >
        <Animated.View style={{ opacity }}>
          <Plus size={24} color={colors.textOnAccent} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={{
          width: 80,
          backgroundColor: colors.cardMuted,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.lg,
          marginBottom: space.lg,
          marginLeft: space.sm,
        }}
        onPress={() => {
          swipeableRef.current?.close();
          onArchive!();
        }}
        accessibilityRole="button"
        accessibilityLabel="Archive project"
      >
        <Animated.View style={{ opacity }}>
          <Archive size={24} color={colors.text} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

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

  return (
    <Swipeable 
      ref={swipeableRef}
      renderLeftActions={renderLeftActions} 
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      {cardContent}
    </Swipeable>
  );
}
`);

fs.writeFileSync('components/ui/ProjectCard.tsx', code);
