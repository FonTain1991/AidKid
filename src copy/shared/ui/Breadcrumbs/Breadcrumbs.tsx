import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'

interface BreadcrumbItem {
  id: string
  name: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onPress: (kitId: string) => void
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onPress }) => {
  const { colors } = useTheme()

  if (items.length <= 1) {
    return null // Не показываем breadcrumbs если только один элемент
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <Pressable
            onPress={() => onPress(item.id)}
            style={{
              paddingVertical: SPACING.xs,
            }}
          >
            <Text style={{
              fontFamily: FONT_FAMILY.medium,
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.medium,
              color: index === items.length - 1 ? colors.text : colors.primary,
            }}>
              {item.name}
            </Text>
          </Pressable>

          {index < items.length - 1 && (
            <Text style={{
              fontFamily: FONT_FAMILY.regular,
              fontSize: FONT_SIZE.sm,
              color: colors.muted,
              marginHorizontal: SPACING.xs,
            }}>
              ›
            </Text>
          )}
        </React.Fragment>
      ))}
    </View>
  )
}
