import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronDown,
  Clock,
} from 'lucide-react-native';
import Svg, { Polygon, Path } from 'react-native-svg';
import { THEME_COLORS, FLOATING_CARD_STYLE } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';

interface RecommendedRoute {
  id: string;
  title: string;
  grade: string;
  image: any;
}

const RECOMMENDED_ROUTES: RecommendedRoute[] = [
  {
    id: 'rec-1',
    title: 'Ripple Effect',
    grade: 'V6',
    image: require('../assets/holds-images/v6-ripple-effect-square.jpg'),
  },
  {
    id: 'rec-2',
    title: 'Slab Rise',
    grade: 'V5',
    image: require('../assets/holds-images/v5-slab-rise.png'),
  },
  {
    id: 'rec-3',
    title: 'Kars Sloper',
    grade: 'V7',
    image: require('../assets/holds-images/v7-kars-sloper.png'),
  },
  {
    id: 'rec-4',
    title: 'Poly Edge',
    grade: 'V8',
    image: require('../assets/holds-images/v8-poly-edge.png'),
  },
  {
    id: 'rec-5',
    title: 'Purple Bulb',
    grade: 'V4',
    image: require('../assets/holds-images/v4-purple-sloper.png'),
  },
  {
    id: 'rec-6',
    title: 'Yellow Pocket',
    grade: 'V3',
    image: require('../assets/holds-images/v3-yellow-jug.png'),
  },
];

/**
 * Solid rock/boulder glyph (not an outline triangle) matching reference mockup
 */
function SolidBoulderIcon({ size = 22, color = '#8A8A96' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="4,15 7,6 15,3 21,8 20,18 8,21"
        fill={color}
      />
      <Path
        d="M 7 6 L 13 11 L 20 18 M 13 11 L 8 21"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.4"
        fill="none"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: 0 }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: insets.bottom + 90,
        }}
      >
        {/* ── 1. Top User Bar ────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {/* Left: Floating capsule container */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: '#1E1E24',
              borderColor: '#2A2A32',
              borderWidth: 1,
              borderRadius: 24,
              paddingVertical: 4,
              paddingLeft: 4,
              paddingRight: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            {/* Avatar: Image avatar with subtle lavender/purple border glow */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderColor: 'rgba(142, 124, 255, 0.7)',
                borderWidth: 1.5,
                shadowColor: '#8E7CFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 5,
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('../assets/maya_avatar.jpg')}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                resizeMode="cover"
              />
            </View>

            {/* Name & Dropdown: "Maya Vong" in crisp 15pt SemiBold text */}
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Maya Vong
            </Text>

            {/* Subtle chevron-down icon */}
            <ChevronDown size={14} color="#8A8A96" />
          </TouchableOpacity>

          {/* Right: Circular bell button (#1E1E24) with lavender unread badge dot */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#1E1E24',
              borderColor: '#2A2A32',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            <Bell size={18} color="#FFFFFF" />
            {/* Small lavender/purple badge dot in top-right corner */}
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 3,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#8E7CFF',
                borderWidth: 1.5,
                borderColor: '#1E1E24',
              }}
            />
          </TouchableOpacity>
        </View>

        {/* ── 2. Headline & Target Grade (Directly below user bar) */}
        <View style={{ paddingHorizontal: 16, marginTop: 18, marginBottom: 8 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 30,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            Keep climbing, Maya
          </Text>
        </View>

        {/* Grade Badge: Small rounded pill (cornerRadius: 12pt), #6EE756, 14pt bold #111115 text */}
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: '#6EE756',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 3.5,
              alignSelf: 'flex-start',
              shadowColor: '#6EE756',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: '#111115',
                fontSize: 14,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              7A
            </Text>
          </View>
        </View>

        {/* ── 3. 3-Column Quick Stats Row ────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 10,
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
        >
          {/* Card 1: Value "108" / Subtitle "FINISHED ROUTES" */}
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                backgroundColor: '#1E1E24',
                borderColor: '#2A2A32',
                borderWidth: 1,
                borderRadius: 16,
                padding: 13,
                flex: 1,
              },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
              108
            </Text>
            <Text
              style={{
                color: '#7A7A88',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.6,
                marginTop: 4,
                lineHeight: 13,
              }}
              className="uppercase"
            >
              FINISHED{'\n'}ROUTES
            </Text>
          </View>

          {/* Card 2: Value "6" / Subtitle "ACTIVE ROUTES" */}
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                backgroundColor: '#1E1E24',
                borderColor: '#2A2A32',
                borderWidth: 1,
                borderRadius: 16,
                padding: 13,
                flex: 1,
              },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
              6
            </Text>
            <Text
              style={{
                color: '#7A7A88',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.6,
                marginTop: 4,
                lineHeight: 13,
              }}
              className="uppercase"
            >
              ACTIVE{'\n'}ROUTES
            </Text>
          </View>

          {/* Card 3: Value "32" / Subtitle "FLASHES ROUTES" */}
          <View
            style={[
              FLOATING_CARD_STYLE,
              {
                backgroundColor: '#1E1E24',
                borderColor: '#2A2A32',
                borderWidth: 1,
                borderRadius: 16,
                padding: 13,
                flex: 1,
              },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
              32
            </Text>
            <Text
              style={{
                color: '#7A7A88',
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.6,
                marginTop: 4,
                lineHeight: 13,
              }}
              className="uppercase"
            >
              FLASHES{'\n'}ROUTES
            </Text>
          </View>
        </View>

        {/* ── 4. "Today's Session" Card Refinements ──────────── */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              backgroundColor: '#202026',
              borderColor: '#2A2A32',
              borderWidth: 1,
              borderRadius: 24,
              padding: 20,
              marginHorizontal: 16,
              marginTop: 0,
              marginBottom: 20,
            },
          ]}
        >
          {/* Header: Lavender label "TODAY'S SESSION" + 3-dot pagination */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: '#8E7CFF',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
              }}
              className="uppercase"
            >
              TODAY'S SESSION
            </Text>

            {/* 3-dot pagination */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* Left active lavender dot */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#8E7CFF',
                }}
              />
              {/* Dot 2 */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#2E2E36',
                }}
              />
              {/* Dot 3 */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#2E2E36',
                }}
              />
            </View>
          </View>

          {/* Route & Type: Solid rock glyph + "V5-V7A" in 28pt Bold White */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              marginBottom: 6,
            }}
          >
            <SolidBoulderIcon size={22} color="#8A8A96" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: '700',
                letterSpacing: -0.5,
              }}
            >
              V5-V7A
            </Text>
          </View>

          {/* Meta: "Overhang • Power Endurance" + Time "Duration 75 min" */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: '#9A9AA6',
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              Overhang • Power Endurance
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color="#9A9AA6" />
              <Text
                style={{
                  color: '#9A9AA6',
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                Duration 75 min
              </Text>
            </View>
          </View>

          {/* Action Button: Full width, #8E7CFF, height 52pt, cornerRadius 26pt */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/session/new')}
            style={{
              backgroundColor: '#8E7CFF',
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#8E7CFF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              START SESSION
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Recommended Routes Carousel ─────────────────── */}
        <View style={{ marginBottom: 12 }}>
          {/* Section Header: "RECOMMENDED ROUTES" in 12pt uppercase tracked text (#8A8A96). No "See All". */}
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Text
              style={{
                color: '#8A8A96',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 1.2,
              }}
              className="uppercase"
            >
              RECOMMENDED ROUTES
            </Text>
          </View>

          {/* Carousel: Square ~156x170pt cards sitting directly on dark textured card surface */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {RECOMMENDED_ROUTES.map((route) => (
              <TouchableOpacity
                key={route.id}
                activeOpacity={0.85}
                style={[
                  FLOATING_CARD_STYLE,
                  {
                    width: 154,
                    height: 168,
                    borderRadius: 20,
                    backgroundColor: '#1C1C22',
                    borderColor: '#2A2A32',
                    borderWidth: 1,
                    padding: 8,
                    justifyContent: 'space-between',
                    position: 'relative',
                  },
                ]}
              >
                {/* Hold Graphic: 3D volume sitting directly on dark surface */}
                <View
                  style={{
                    width: '100%',
                    height: 114,
                    borderRadius: 14,
                    overflow: 'hidden',
                    backgroundColor: '#141418',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={route.image}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                </View>

                {/* Top Row: Translucent grade pill on top left ("V6", "V5") */}
                <View
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    backgroundColor: 'rgba(20, 20, 26, 0.75)',
                    borderColor: 'rgba(255, 255, 255, 0.16)',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 9,
                    paddingVertical: 2.5,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {route.grade}
                  </Text>
                </View>

                {/* Bottom label: Route title ("Ripple Effect", "Slab Rise") in 14pt SemiBold white */}
                <View style={{ paddingHorizontal: 4, paddingBottom: 4 }}>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'left',
                    }}
                    numberOfLines={1}
                  >
                    {route.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
