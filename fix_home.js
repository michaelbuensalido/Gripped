const fs = require('fs');
let code = fs.readFileSync('app/index.tsx', 'utf8');

// Replace Screen with View/Animated.ScrollView
code = code.replace(
  /import \{ View, Text, ScrollView, TouchableOpacity \} from 'react-native';/,
  "import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';"
);

// Add Trophy icon
code = code.replace(
  /import \{ Settings as SettingsIcon, Plus, PlayCircle \} from 'lucide-react-native';/,
  "import { Settings as SettingsIcon, Plus, PlayCircle, Trophy } from 'lucide-react-native';"
);

// Add ProjectCard
code = code.replace(
  /import \{ HeroCard \} from '\.\.\/components\/ui\/HeroCard';/,
  "import { HeroCard } from '../components/ui/HeroCard';\nimport { ProjectCard } from '../components/ui/ProjectCard';"
);

code = code.replace(
  /const \[elapsed, setElapsed\] = useState\(0\);/,
  "const [elapsed, setElapsed] = useState(0);\n  const insets = useSafeAreaInsets();\n  const scrollY = React.useRef(new Animated.Value(0)).current;"
);

// Replace Screen with Animated.ScrollView
code = code.replace(
  /<Screen scroll>/,
  `<View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: Math.max(insets.top, space.xxl), paddingHorizontal: space.lg }}
      >`
);
code = code.replace(/<\/Screen>/, 
  `  </Animated.ScrollView>
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: insets.top,
        backgroundColor: colors.bg,
        opacity: scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' }),
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }} pointerEvents="none" />
    </View>`
);

// Header replacement
code = code.replace(
  /<View style=\{\{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space\.xl \}\}>[\s\S]*?<\/View>\s*<\/View>/,
  `<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xl }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={[type.body, { color: colors.textMuted, marginBottom: space.xs }]}>{greeting}</Text>
          <Text style={[type.display, { color: colors.text }]}>Welcome back</Text>
          {data.hardest30d && (
            <View style={{ marginTop: space.sm }}>
               <GradePill gradeIndex={data.hardest30d.gradeIndex} label={\`Best \${data.hardest30d.gradeRaw}\`} />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={{
            padding: space.sm,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: space.sm
          }}
        >
          <SettingsIcon size={20} color={colors.text} />
        </TouchableOpacity>
      </View>`
);

// Projects Replacement
code = code.replace(
  /\{data\.projects\.slice\(0, 5\)\.map\(\(p: any\) => \([\s\S]*?\)\)\s*\}/,
  `{data.projects.length === 1 ? (
                  <TouchableOpacity onPress={() => router.push('/projects')} style={{ width: Dimensions.get('window').width - 2 * space.lg }}>
                    <ProjectCard project={data.projects[0]} variant="compact" />
                  </TouchableOpacity>
                ) : (
                  data.projects.slice(0, 5).map((p: any) => (
                    <TouchableOpacity key={p.id} onPress={() => router.push('/projects')} style={{ width: Dimensions.get('window').width - 2 * space.lg - 40 }}>
                      <ProjectCard project={p} variant="compact" />
                    </TouchableOpacity>
                  ))
                )}`
);

// Remove weeklyVolumeChange from VolumeChart
code = code.replace(
  /changePercent=\{data\.weeklyVolumeChange\}/,
  ""
);

// Change PB banner to use Trophy
code = code.replace(
  /<Text style=\{\{ fontSize: 20 \}\}>🎉<\/Text>/,
  "<Trophy size={20} color={colors.accentText} />"
);

// Add climbs and sends to SessionRow
code = code.replace(
  /hardestGrade=\{s\.hardestGradeRaw\}/,
  "climbs={s.climbs}\n                    sends={s.sends}\n                    hardestGrade={s.hardestGradeRaw}"
);

fs.writeFileSync('app/index.tsx', code);
