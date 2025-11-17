import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { memo, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const AVATAR_OPTIONS = ['👤', '👨', '👩', '👦', '👧', '👶', '🧑', '👴', '👵', '🧒']
interface AvatarProps {
  onChange?: (avatar: string) => void
  value?: string
}
export const Avatar = memo(({ onChange, value }: AvatarProps) => {
  const { colors } = useTheme()
  const [selectedAvatar, setSelectedAvatar] = useState(value || AVATAR_OPTIONS[0])

  const handleChange = (avatar: string) => {
    setSelectedAvatar(avatar)
    onChange?.(avatar)
  }

  useEffect(() => {
    onChange?.(AVATAR_OPTIONS[0])
  }, [])

  return (
    <View>
      <Text style={[styles.formLabel, { color: colors.text }]}>Аватар</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarScroll}
      >
        {AVATAR_OPTIONS.map(avatar => (
          <TouchableOpacity
            key={avatar}
            activeOpacity={0.8}
            style={[
              styles.avatarOption,
              {
                borderColor: selectedAvatar === avatar ? colors.primary : colors.border,
                backgroundColor: selectedAvatar === avatar ? colors.primary + '15' : 'white'
              }
            ]}
            onPress={() => handleChange(avatar)}
          >
            <Text style={styles.avatarOptionText}>{avatar}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  formLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm
  },
  avatarScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarOptionText: {
    fontSize: FONT_SIZE.heading
  }
})