import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface AnimatedLogoIconProps {
  backgroundColor: string;
  icon: FeatherIconName;
  iconColor?: string;
  size?: number;
  containerSize?: number;
  borderRadius?: number;
}

export default function AnimatedLogoIcon({
  backgroundColor,
  icon,
  iconColor = '#fff',
  size = 28,
  containerSize = 72,
  borderRadius = 20,
}: AnimatedLogoIconProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 14, stiffness: 120 }, (finished) => {
      if (finished) {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 1100 }),
            withTiming(1, { duration: 1100 }),
          ),
          -1,
          false,
        );
      }
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerStyle,
      ]}
    >
      <Animated.View style={iconStyle}>
        <Feather name={icon} size={size} color={iconColor} />
      </Animated.View>
    </Animated.View>
  );
}
