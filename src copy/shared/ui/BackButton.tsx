import { useTheme } from '@/app/providers/theme'
import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

interface BackButtonProps {
  onPress?: () => void
  style?: any
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  const navigation = useNavigation()
  const { colors } = useTheme()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      navigation.goBack()
    }
  }

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <View style={[styles.arrow, { borderColor: colors.text }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
})
