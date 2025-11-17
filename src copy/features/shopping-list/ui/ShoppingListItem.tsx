import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '@/app/providers/theme'
import type { ShoppingItem } from '@/entities/shopping-item'

interface ShoppingListItemProps {
  item: ShoppingItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onAddToKit?: (item: ShoppingItem) => void
}

export function ShoppingListItem({ item, onToggle, onDelete, onAddToKit }: ShoppingListItemProps) {
  const { colors } = useTheme()

  const handleAddToKit = () => {
    if (onAddToKit) {
      onAddToKit(item)
    }
  }

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
          onPress: () => onDelete(item.id)
        }
      ]
    )
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        item.isPurchased && styles.purchasedContainer
      ]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          { borderColor: colors.border },
          item.isPurchased && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}
        onPress={() => onToggle(item.id)}
      >
        {item.isPurchased && (
          <Icon name="check" size={16} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            item.isPurchased && styles.purchasedText
          ]}
        >
          {item.medicineName}
        </Text>

        {item.description && (
          <Text
            style={[
              styles.description,
              { color: colors.textSecondary },
              item.isPurchased && styles.purchasedText
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {item.isPurchased && onAddToKit && (
          <TouchableOpacity
            style={[styles.addToKitButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToKit}
          >
            <Icon name="plus-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addToKitText}>Добавить в аптечку</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Icon name="trash-2" size={20} color={colors.error || '#F44336'} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12
  },
  purchasedContainer: {
    opacity: 0.6
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  description: {
    fontSize: 14,
    marginBottom: 4
  },
  purchasedText: {
    textDecorationLine: 'line-through'
  },
  addToKitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6
  },
  addToKitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8
  }
})

