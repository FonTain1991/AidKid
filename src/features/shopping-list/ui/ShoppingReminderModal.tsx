import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity
} from 'react-native'
import DatePicker from 'react-native-date-picker'
import { useTheme } from '@/app/providers/theme'
import Icon from 'react-native-vector-icons/Feather'

interface ShoppingReminderModalProps {
  visible: boolean
  currentReminder: Date | null
  onClose: () => void
  onSetReminder: (date: Date) => void
  onCancelReminder: () => void
}

export function ShoppingReminderModal({
  visible,
  currentReminder,
  onClose,
  onSetReminder,
  onCancelReminder
}: ShoppingReminderModalProps) {
  const { colors } = useTheme()
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    if (visible) {
      if (currentReminder) {
        setSelectedDate(new Date(currentReminder))
      } else {
        // Устанавливаем по умолчанию на завтра в 10:00
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        setSelectedDate(tomorrow)
      }
    }
  }, [visible, currentReminder])

  const handleSave = () => {
    const now = new Date()
    if (selectedDate <= now) {
      alert('Пожалуйста, выберите время в будущем')
      return
    }

    onSetReminder(selectedDate)
    onClose()
  }

  const handleCancel = () => {
    if (currentReminder) {
      onCancelReminder()
    }
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Заголовок */}
          <View style={styles.header}>
            <Icon name="bell" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              Напоминание о покупках
            </Text>
          </View>

          {/* Выбор даты и времени */}
          <View style={styles.content}>
            <View style={styles.pickerContainer}>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                mode="datetime"
                locale="ru"
                minimumDate={new Date()}
              />
            </View>

            {/* Информация */}
            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <Icon name="info" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Вы получите уведомление в указанное время
              </Text>
            </View>
          </View>

          {/* Кнопки */}
          <View style={styles.buttons}>
            {currentReminder && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.deleteButton,
                  { backgroundColor: colors.background }
                ]}
                onPress={handleCancel}
              >
                <Icon name="trash-2" size={18} color="#FF3B30" />
                <Text style={[styles.buttonText, { color: '#FF3B30' }]}>
                  Удалить
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.background }
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Отмена
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Icon name="check" size={18} color="#FFFFFF" />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Установить
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  content: {
    marginBottom: 20,
    gap: 16
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6
  },
  saveButton: {
    flex: 1,
    minWidth: 120
  },
  cancelButton: {
    flex: 1,
    minWidth: 100
  },
  deleteButton: {
    flexBasis: '100%'
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600'
  }
})

