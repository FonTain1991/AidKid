import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useEvent, useMyNavigation, useShoppingList } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { ShoppingList } from '@/services/models'
import { useAppStore } from '@/store'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

interface ShoppingListItemProps {
  item: ShoppingList & { id: number }
}

export function ShoppingListItem({ item }: ShoppingListItemProps) {
  const { colors } = useTheme()
  const { updateShoppingList, deleteShoppingList } = useShoppingList()
  const { medicines } = useAppStore(state => state)
  const navigation = useMyNavigation()

  const handleAddToKit = useEvent(async () => {
    const existingMedicine = medicines.find(med => med.name.toLowerCase() === item.medicineName.toLowerCase())

    if (existingMedicine) {
      Alert.alert(
        'Лекарство найдено',
        `Лекарство "${existingMedicine.name}" уже есть в аптечке. Открыть его?`,
        [
          {
            text: 'Отмена',
            style: 'cancel'
          },
          {
            text: 'Открыть',
            onPress: async () => {
              await deleteShoppingList(item.id)
              navigation.navigate('medicine', {
                medicineId: existingMedicine.id ?? undefined
              })
            }
          }
        ]
      )
      return
    }

    await deleteShoppingList(item.id)
    navigation.navigate('medicine', {
      medicineName: item.medicineName
    })

  })

  const handleDelete = () => {
    Alert.alert(
      'Удалить товар',
      'Вы уверены, что хотите удалить этот товар из списка?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteShoppingList(Number(item.id))
        }
      ]
    )
  }

  const handleToggle = () => {
    updateShoppingList({
      id: item.id,
      isPurchased: item.isPurchased ? 0 : 1
    })
  }

  return (
    <Pressable
      style={({ pressed }) => ([
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1
        }
      ])}
      onPress={handleToggle}
    >
      <Pressable
        style={[
          styles.checkbox,
          { borderColor: colors.border },
          item.isPurchased ? { backgroundColor: colors.primary, borderColor: colors.primary } : undefined
        ]}
        onPress={handleToggle}
      >
        {!!item.isPurchased && (
          <Icon name='check' size={16} color={colors.card} />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            item.isPurchased ? styles.purchasedText : undefined
          ]}
        >
          {item.medicineName}
        </Text>

        {!!item.description && (
          <Text
            style={[
              styles.description,
              { color: colors.muted },
              item.isPurchased ? styles.purchasedText : undefined
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {!!item.isPurchased && (
          <Pressable
            style={[styles.addToKitButton, { backgroundColor: colors.primary }, item.isPurchased ? { backgroundColor: colors.secondary } : undefined]}
            onPress={handleAddToKit}
          >
            <Icon name='plus-circle' size={16} color={colors.card} />
            <Text style={[styles.addToKitText, { color: colors.card }]}>Добавить в аптечку</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Icon name='trash-2' size={20} color={colors.error} />
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold
  },
  description: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm
  },
  purchasedText: {
    textDecorationLine: 'line-through'
  },
  addToKitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    gap: 6
  },
  addToKitText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  deleteButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.md
  }
})

