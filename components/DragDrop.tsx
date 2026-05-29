import { Feather } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { Book, Folder } from '@/types';

export interface FolderPosition {
  id: string;
  top: number;
  bottom: number;
}

export function DragFloatingCard({
  book,
  dragX,
  dragY,
}: {
  book: Book;
  dragX: import('react-native-reanimated').SharedValue<number>;
  dragY: import('react-native-reanimated').SharedValue<number>;
}) {
  const colors = useColors();
  const CARD_WIDTH = 230;

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: dragX.value - CARD_WIDTH / 2,
    top: dragY.value - 44,
    width: CARD_WIDTH,
    zIndex: 9999,
  }));

  return (
    <Animated.View style={animStyle} pointerEvents="none">
      <View
        style={[
          floatStyles.card,
          { backgroundColor: colors.card, borderColor: colors.primary },
        ]}
      >
        <View style={floatStyles.row}>
          <Feather name="book" size={14} color={colors.primary} />
          <Text style={[floatStyles.title, { color: colors.foreground }]} numberOfLines={1}>
            {book.title}
          </Text>
        </View>
        <Text style={[floatStyles.genre, { color: colors.mutedForeground }]}>
          {book.genre}
        </Text>
      </View>
    </Animated.View>
  );
}

const floatStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 14,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  genre: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 22,
  },
});

export function DraggableBookCard({
  children,
  book,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  children: React.ReactNode;
  book: Book;
  onDragStart: (book: Book, x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const startCb = useCallback(
    (b: Book, x: number, y: number) => onDragStart(b, x, y),
    [onDragStart]
  );
  const moveCb = useCallback(
    (x: number, y: number) => onDragMove(x, y),
    [onDragMove]
  );
  const endCb = useCallback(() => onDragEnd(), [onDragEnd]);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(500)
    // If the finger moves more than 25 px vertically before the long-press
    // fires, fail the gesture so the parent FlatList can scroll freely.
    .failOffsetY([-25, 25])
    .onStart((e) => {
      'worklet';
      scale.value = withSpring(1.04, { damping: 12 });
      opacity.value = withTiming(0.78, { duration: 150 });
      runOnJS(startCb)(book, e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(moveCb)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 14 });
      opacity.value = withTiming(1, { duration: 150 });
      runOnJS(endCb)();
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 14 });
      opacity.value = withTiming(1, { duration: 150 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

export function DroppableFolderCard({
  folder,
  bookCount,
  previewTitles,
  isHovered,
  onRegisterLayout,
}: {
  folder: Folder;
  bookCount: number;
  previewTitles: string[];
  isHovered: boolean;
  onRegisterLayout: (id: string, top: number, bottom: number) => void;
}) {
  const colors = useColors();
  const viewRef = useRef<View>(null);

  const handleLayout = useCallback(() => {
    viewRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      onRegisterLayout(folder.id, pageY, pageY + h);
    });
  }, [folder.id, onRegisterLayout]);

  const scaleAnim = useSharedValue(1);

  React.useEffect(() => {
    scaleAnim.value = withSpring(isHovered ? 1.02 : 1, { damping: 14 });
  }, [isHovered, scaleAnim]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <View
        ref={viewRef}
        onLayout={handleLayout}
        style={[
          dropStyles.card,
          {
            backgroundColor: isHovered ? folder.color + '1A' : colors.card,
            borderColor: isHovered ? folder.color : colors.border,
            borderWidth: isHovered ? 2 : 1,
          },
        ]}
      >
        <View style={[dropStyles.colorBar, { backgroundColor: folder.color }]} />
        <View style={dropStyles.body}>
          <Text
            style={[dropStyles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Text style={[dropStyles.count, { color: colors.mutedForeground }]}>
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </Text>
          {previewTitles.length > 0 && (
            <View style={dropStyles.previews}>
              {previewTitles.map((t, i) => (
                <Text
                  key={i}
                  style={[dropStyles.preview, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  · {t}
                </Text>
              ))}
            </View>
          )}
        </View>
        {isHovered ? (
          <View
            style={[dropStyles.dropBadge, { backgroundColor: folder.color }]}
          >
            <Feather name="download" size={12} color="#fff" />
            <Text style={dropStyles.dropBadgeText}>Drop here</Text>
          </View>
        ) : (
          <Feather
            name="folder"
            size={18}
            color={colors.mutedForeground}
            style={dropStyles.chevron}
          />
        )}
      </View>
    </Animated.View>
  );
}

const dropStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    marginBottom: 10,
  },
  colorBar: { width: 6 },
  body: { flex: 1, padding: 16, gap: 4 },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  previews: { marginTop: 2, gap: 2 },
  preview: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dropBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  chevron: { alignSelf: 'center', marginRight: 14 },
});
