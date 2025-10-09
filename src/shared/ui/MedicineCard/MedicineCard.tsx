import React from 'react'
import { Pressable, Text, View, Image } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { MedicineWithStock } from '@/entities/medicine/model/types'
import { RADIUS, SPACING } from '@/shared/config'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'
import { getMedicinePhotoUri } from '@/shared/lib'

interface MedicineCardProps {
  medicine: MedicineWithStock
  onPress: () => void
  onMenuPress?: () => void
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onPress, onMenuPress }) => {
  const { colors } = useTheme()
  console.log(medicine)
  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity} ${unit}`
  }

  const formatExpiryDate = (date?: Date) => {
    if (!date) {
      return null
    }
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Фото лекарства */}
        {medicine.photoPath ? (
          <Image
            source={{ uri: getMedicinePhotoUri(medicine.photoPath) || undefined }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              marginRight: SPACING.md,
              backgroundColor: '#f0f0f0',
            }}
            resizeMode='cover'
          />
        ) : (
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            marginRight: SPACING.md,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 32 }}>💊</Text>
          </View>
        )}

        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={{
            fontFamily: FONT_FAMILY.semiBold,
            fontSize: FONT_SIZE.md,
            fontWeight: FONT_WEIGHT.semiBold,
            color: colors.text,
            marginBottom: SPACING.xs,
          }}>
            {medicine.name}
          </Text>

          {medicine.description && (
            <Text style={{
              fontFamily: FONT_FAMILY.regular,
              fontSize: FONT_SIZE.sm,
              color: colors.muted,
              marginBottom: SPACING.xs,
            }}>
              {medicine.description}
            </Text>
          )}

          {/* Срок годности отдельной строкой, если есть */}
          {medicine.stock?.expiryDate && (
            <Text style={{
              fontFamily: FONT_FAMILY.regular,
              fontSize: FONT_SIZE.xs,
              color: medicine.isExpiringSoon ? colors.error : colors.muted,
              marginBottom: SPACING.xs,
            }}>
              до {formatExpiryDate(medicine.stock.expiryDate)}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs }}>
            <Text style={{
              fontFamily: FONT_FAMILY.medium,
              fontSize: FONT_SIZE.sm,
              color: colors.secondary,
              marginRight: SPACING.sm,
            }}>
              {formatQuantity(medicine.totalQuantity, medicine.stock?.unit || 'шт')}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          {onMenuPress && (
            <Pressable
              style={{
                padding: SPACING.sm,
                marginBottom: SPACING.xs,
              }}
              onPress={e => {
                e.stopPropagation()
                onMenuPress()
              }}
            >
              <Text style={{
                fontSize: FONT_SIZE.xl,
                color: colors.muted,
                lineHeight: FONT_SIZE.sm,
              }}>
                ⋮
              </Text>
            </Pressable>
          )}
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          }} />
        </View>
      </View>
    </Pressable>
  )
}
