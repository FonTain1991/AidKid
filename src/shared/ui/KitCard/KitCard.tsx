import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useKitCardStyles } from './useKitCardStyles'

interface KitCardProps {
  id: string
  name: string
  description?: string
  color?: string
  onPress: (id: string) => void
  onMenuPress: (id: string) => void
  onAddMedicine?: (kitId: string) => void
}

export const KitCard: React.FC<KitCardProps> = ({
  id,
  name,
  description,
  color,
  onPress,
  onMenuPress,
  onAddMedicine
}) => {
  const { styles, colors } = useKitCardStyles()

  // Дефолтный цвет если не указан
  const cardColor = color || colors.primary

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          opacity: pressed ? 0.8 : 1,
        }
      ]}
      onPress={() => onPress(id)}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.white }]} numberOfLines={2}>
            {name}
          </Text>
          <Pressable
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation()
              onMenuPress(id)
            }}
          >
            <Text style={[styles.menuIcon, { color: colors.white }]}>⋯</Text>
          </Pressable>
        </View>

        {description && (
          <Text style={[styles.description, { color: colors.white }]} numberOfLines={3}>
            {description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.icon, { color: colors.white }]}>🏥</Text>
          </View>
          {onAddMedicine && (
            <Pressable
              style={styles.addMedicineButton}
              onPress={(e) => {
                e.stopPropagation()
                onAddMedicine(id)
              }}
            >
              <Text style={[styles.addMedicineText, { color: colors.white }]}>+ Лекарство</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  )
}
