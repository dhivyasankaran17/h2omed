import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WIDTH = 160;
const HEIGHT = 220;
// Tumbler: slightly wider at the top than the bottom.
const GLASS_POINTS = `0,0 ${WIDTH},0 ${WIDTH * 0.86},${HEIGHT} ${WIDTH * 0.14},${HEIGHT}`;

const BUBBLES = [
  { x: WIDTH * 0.36, duration: 2200, delay: 0, r: 3.5 },
  { x: WIDTH * 0.52, duration: 2600, delay: 700, r: 3 },
  { x: WIDTH * 0.66, duration: 1900, delay: 1300, r: 4 },
];

function Bubble({
  x,
  r,
  duration,
  delay,
  fill,
}: {
  x: number;
  r: number;
  duration: number;
  delay: number;
  fill: SharedValue<number>;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [t, duration, delay]);

  const animatedProps = useAnimatedProps(() => {
    const fillHeightPx = fill.value * HEIGHT;
    if (fillHeightPx < 16) return { cy: HEIGHT + 40, opacity: 0 };
    const travel = Math.max(0, fillHeightPx - 18);
    const cy = HEIGHT - 10 - t.value * travel;
    const opacity = Math.sin(Math.min(t.value, 1) * Math.PI) * 0.55;
    return { cy, opacity };
  });

  return <AnimatedCircle cx={x} r={r} fill="white" animatedProps={animatedProps} clipPath="url(#glassClip)" />;
}

interface GlassVesselProps {
  /** 0..1 */
  progress: number;
  width?: number;
}

/** A tumbler that fills with liquid — a springy rise on each log, gentle rising bubbles, and a bobbing surface line. */
export function GlassVessel({ progress, width = 160 }: GlassVesselProps) {
  const scale = width / WIDTH;
  const height = HEIGHT * scale;
  const clamped = Math.max(0, Math.min(1, progress));
  const animatedProgress = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(clamped, { damping: 11, stiffness: 90, mass: 0.6 });
  }, [clamped, animatedProgress]);

  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1, true);
  }, [bob]);

  const fillProps = useAnimatedProps(() => {
    const fillHeight = animatedProgress.value * HEIGHT;
    return { height: Math.max(0, fillHeight), y: HEIGHT - fillHeight };
  });

  const highlightProps = useAnimatedProps(() => {
    const fillHeight = animatedProgress.value * HEIGHT;
    const wobble = (bob.value - 0.5) * 3;
    return { y: Math.max(0, HEIGHT - fillHeight - 3 + wobble), opacity: fillHeight > 6 ? 1 : 0 };
  });

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <ClipPath id="glassClip">
            <Polygon points={GLASS_POINTS} />
          </ClipPath>
          <LinearGradient id="glassGradient" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={colors.accentTeal} />
            <Stop offset="1" stopColor={colors.neonCyan} />
          </LinearGradient>
        </Defs>

        {/* Empty glass */}
        <Polygon points={GLASS_POINTS} fill={colors.surfaceAlt} />

        {/* Animated liquid fill */}
        <AnimatedRect x={0} width={WIDTH} fill="url(#glassGradient)" animatedProps={fillProps} clipPath="url(#glassClip)" />

        {/* Rising bubbles, clipped to the liquid */}
        {BUBBLES.map((b, i) => (
          <Bubble key={i} x={b.x} r={b.r} duration={b.duration} delay={b.delay} fill={animatedProgress} />
        ))}

        {/* Bobbing surface highlight */}
        <AnimatedRect x={0} width={WIDTH} height={3} fill={colors.neonCyan} animatedProps={highlightProps} clipPath="url(#glassClip)" />

        {/* Glossy shine */}
        <Ellipse cx={WIDTH * 0.3} cy={HEIGHT * 0.2} rx={WIDTH * 0.16} ry={HEIGHT * 0.14} fill="white" opacity={0.12} clipPath="url(#glassClip)" />

        {/* Outline */}
        <Polygon points={GLASS_POINTS} fill="none" stroke={colors.neonCyan} strokeWidth={2} strokeOpacity={0.8} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
