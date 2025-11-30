import { SPACING, WIDTH } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SPRING_CONFIG = {
  duration: 1200,
  overshootClamping: true,
  dampingRatio: 0.8,
}

const OFFSET = 60

const FloatingActionButtonItem = ({ isExpanded, index, buttonLetter, onPress }: FloatingActionButtonItemProps) => {
  const { colors } = useTheme()
  const animatedStyles = useAnimatedStyle(() => {
    // highlight-next-line
    const moveValue = isExpanded.value ? OFFSET * index : 0
    const translateValue = withSpring(-moveValue, SPRING_CONFIG)
    // highlight-next-line
    const delay = index * 100

    const scaleValue = isExpanded.value ? 1 : 0

    return {
      transform: [
        { translateY: translateValue },
        {
          scale: withDelay(delay, withTiming(scaleValue)),
        },
      ]
    }
  })

  return (
    <AnimatedPressable
      style={[animatedStyles, styles.button, {
        backgroundColor: colors.secondary,
        alignSelf: 'flex-end',
      }]}
      onPress={onPress}
    >
      <Animated.Text style={[styles.content, { color: colors.headerColor }]}>{buttonLetter}</Animated.Text>
    </AnimatedPressable>
  )
}

interface FloatingActionButtonItemProps {
  isExpanded: SharedValue<boolean>
  index: number
  buttonLetter: string
  onPress: () => void
}

interface FloatingActionButtonProps {
  items: {
    letter: string
    onPress: () => void
  }[]
}

export function FloatingActionButton({ items }: FloatingActionButtonProps) {
  const { colors } = useTheme()
  const isExpanded = useSharedValue(false)

  const handlePress = () => {
    isExpanded.value = !isExpanded.value
  }

  const plusIconStyle = useAnimatedStyle(() => {
    // highlight-next-line
    const moveValue = interpolate(Number(isExpanded.value), [0, 1], [0, 2])
    const translateValue = withTiming(moveValue)
    const rotateValue = isExpanded.value ? '45deg' : '0deg'

    return {
      transform: [
        { translateX: translateValue },
        { rotate: withTiming(rotateValue) },
      ],
    }
  })

  const itemRevers = useMemo(() => items.reverse(), [items])

  return (
    <View style={{
      position: 'absolute',
      bottom: SPACING.md,
      right: SPACING.md,
      width: WIDTH - SPACING.xl,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    }}>
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          onPress={handlePress}
          style={[mainButtonStyles.button, { backgroundColor: colors.primary }]}>
          <Animated.Text style={[plusIconStyle, mainButtonStyles.content, { color: colors.headerColor }]}>
            +
          </Animated.Text>
        </AnimatedPressable>
      </View>
      {itemRevers.map((item, index) => (
        <FloatingActionButtonItem
          key={index}
          isExpanded={isExpanded}
          index={index + 1}
          buttonLetter={item.letter}
          onPress={() => {
            item.onPress()
            handlePress()
          }}
        />
      ))}
    </View>
  )
}

const mainButtonStyles = StyleSheet.create({
  button: {
    zIndex: 2,
    height: 56,
    width: 56,
    borderRadius: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    fontSize: FONT_SIZE.heading,
  },
})

const styles = StyleSheet.create({
  button: {
    height: 40,
    position: 'absolute',
    borderRadius: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  content: {
    fontWeight: FONT_WEIGHT.medium
  },
})
