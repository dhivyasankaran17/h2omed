import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const WIDTH = 110;
const HEIGHT = 200;
const GAP = 5;

function Segment({ filled, top, height }: { filled: boolean; top: number; height: number }) {
  const anim = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    anim.value = withTiming(filled ? 1 : 0, { duration: 350 });
  }, [filled, anim]);

  const animatedProps = useAnimatedProps(() => {
    const grown = anim.value * height;
    return {
      y: top + (height - grown),
      height: grown,
      opacity: 0.3 + anim.value * 0.7,
    };
  });

  return (
    <AnimatedRect
      x={0}
      width={WIDTH}
      rx={6}
      fill={filled ? 'url(#pillSegmentGradient)' : colors.cardBorder}
      animatedProps={animatedProps}
      clipPath="url(#pillClip)"
    />
  );
}

interface PillVesselProps {
  /** How many of today's reminders are marked taken. */
  taken: number;
  /** Total enabled reminders today (segment count). */
  total: number;
  width?: number;
  /** Text shown centered below the shape, e.g. "1 / 2 taken today". */
  caption?: string;
}

/**
 * A segmented capsule — one block per reminder today, lighting up solid as each is taken.
 * Deliberately graphical/digital rather than liquid: no fluid motion, no bubbles.
 */
export function PillVessel({ taken, total, width = 110, caption }: PillVesselProps) {
  const scale = width / WIDTH;
  const height = HEIGHT * scale;
  const segmentCount = Math.max(1, total);
  const segmentHeight = (HEIGHT - GAP * (segmentCount - 1)) / segmentCount;

  const segments = Array.from({ length: segmentCount }, (_, indexFromBottom) => {
    const top = HEIGHT - (indexFromBottom + 1) * segmentHeight - indexFromBottom * GAP;
    const filled = indexFromBottom < taken;
    return { key: indexFromBottom, top, filled };
  });

  return (
    <View style={styles.wrap}>
      <View style={[styles.svgWrap, { width, height }]}>
        <Svg width={width} height={height} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Defs>
            <ClipPath id="pillClip">
              <Rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={WIDTH / 2} ry={WIDTH / 2} />
            </ClipPath>
            <LinearGradient id="pillSegmentGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.neonCyan} />
              <Stop offset="1" stopColor={colors.accentTeal} />
            </LinearGradient>
          </Defs>

          {/* Empty capsule */}
          <Rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={WIDTH / 2} ry={WIDTH / 2} fill={colors.surfaceAlt} />

          {/* One block per reminder, filling solid (no liquid motion) as each is taken */}
          {segments.map((s) => (
            <Segment key={s.key} filled={s.filled} top={s.top} height={segmentHeight} />
          ))}

          {/* Glossy shine */}
          <Ellipse cx={WIDTH * 0.32} cy={HEIGHT * 0.16} rx={WIDTH * 0.22} ry={HEIGHT * 0.1} fill="white" opacity={0.1} clipPath="url(#pillClip)" />

          {/* Outline */}
          <Rect
            x={1}
            y={1}
            width={WIDTH - 2}
            height={HEIGHT - 2}
            rx={WIDTH / 2}
            ry={WIDTH / 2}
            fill="none"
            stroke={colors.neonCyan}
            strokeWidth={2}
            strokeOpacity={0.8}
          />
        </Svg>
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
  caption: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
});
