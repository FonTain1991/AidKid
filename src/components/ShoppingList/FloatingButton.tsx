import { SPACING, WIDTH } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../Text'

export function FloatingButton() {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()

  const handlePress = useEvent(() => {
    navigate('addShoppingItem')
  })

  return (
    <View style={{
      position: 'absolute',
      bottom: SPACING.md,
      right: SPACING.md,
      width: WIDTH - SPACING.xl,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    }}>
      <View style={mainButtonStyles.buttonContainer}>
        <Pressable
          onPress={handlePress}
          style={[mainButtonStyles.button, { backgroundColor: colors.primary }]}>
          <Text style={[mainButtonStyles.content, { color: colors.headerColor }]}>
            +
          </Text>
        </Pressable>
      </View>
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
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  content: {
    fontSize: FONT_SIZE.heading,
  },
})
