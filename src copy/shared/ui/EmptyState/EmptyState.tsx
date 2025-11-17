import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { MedicineKit } from '@/entities/kit/model/types'
import { SPACING } from '@/shared/config'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'

interface EmptyStateProps {
  kit: MedicineKit | null
  onCreateKit: () => void
  onCreateMedicine: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  kit,
  onCreateKit,
  onCreateMedicine
}) => {
  const { colors } = useTheme()

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xxl,
    }}>
      <Text style={{
        fontFamily: FONT_FAMILY.semiBold,
        fontSize: FONT_SIZE.lg,
        fontWeight: FONT_WEIGHT.semiBold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
      }}>
        {kit?.name || 'Категория'} пуста
      </Text>

      <Text style={{
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.md,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: FONT_SIZE.md * 1.4,
      }}>
        Добавьте подкатегории или лекарства для организации содержимого
      </Text>
    </View>
  )
}
