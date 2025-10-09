import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { notificationService } from '@/shared/lib/notifications'
import { Medicine } from '@/entities/medicine/model/types'
import { FamilyMember } from '@/entities/family-member/model/types'
import { DatePicker } from '@/shared/ui/DatePicker'
import { TextInput } from '@/shared/ui/TextInput'
import { MedicinePicker } from '@/shared/ui'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface ReminderData {
  medicineId: string
  familyMemberId?: string
  title: string
  time: Date
  frequency: 'once' | 'daily' | 'weekly'
  quantity: number
  isEnabled: boolean
}

export function AddReminderScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([])
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderTime, setReminderTime] = useState(new Date())
  const [reminderTimes, setReminderTimes] = useState<Date[]>([new Date(), new Date(), new Date()])
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly'>('daily')
  const [quantity, setQuantity] = useState(1)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  const loadFamilyMembers = async () => {
    try {
      await databaseService.init()
      const allFamilyMembers = await databaseService.getFamilyMembers()
      setFamilyMembers(allFamilyMembers)
      setIsLoading(false)
      console.log('✅ Family members loaded:', allFamilyMembers.length)
    } catch (error) {
      console.error('❌ Failed to load family members:', error)
      setIsLoading(false)
    }
  }

  // Перезагружаем членов семьи при фокусе экрана
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadFamilyMembers)
    return unsubscribe
  }, [navigation])

  // Инициализируем время по умолчанию для разных приемов
  useEffect(() => {
    const defaultTimes = []
    const baseTime = new Date()

    // Устанавливаем разное время для каждого приема
    // 1-й прием: 09:00, 2-й: 14:00, 3-й: 20:00, и т.д.
    const defaultHours = [9, 14, 20, 12, 16, 22, 10, 15, 18, 21]

    for (let i = 0; i < 10; i++) {
      const time = new Date()
      time.setHours(defaultHours[i] || 9 + i * 2, 0, 0, 0)
      defaultTimes.push(time)
    }

    setReminderTimes(defaultTimes)
  }, [])

  const scheduleReminderNotifications = async (options: {
    medicines: Medicine[]
    reminderId: string
    title: string
    times: Date[]
    frequency: 'once' | 'daily' | 'weekly'
    quantity: number
    familyMemberId?: string
  }) => {
    const { medicines, reminderId, title, times, frequency, quantity, familyMemberId } = options
    const now = new Date()
    const medicineNames = medicines.map(m => m.name).join(', ')
    const medicineIds = medicines.map(m => m.id)

    if (frequency === 'once') {
      // Одноразовое напоминание - всегда 1 уведомление
      const notificationTime = new Date(times[0])
      notificationTime.setFullYear(now.getFullYear())
      notificationTime.setMonth(now.getMonth())
      notificationTime.setDate(now.getDate())

      // Если время уже прошло сегодня, планируем на завтра
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1)
      }

      const notificationId = `reminder-once-${reminderId}-${Date.now()}`
      await notificationService.scheduleNotification(notificationId, {
        title,
        body: `Время принять: ${medicineNames}`,
        notificationDate: notificationTime,
        data: {
          type: 'reminder',
          reminderId,
          medicineIds: JSON.stringify(medicineIds),
          familyMemberId: familyMemberId || '',
          frequency: 'once',
        },
        kitId: medicines[0].kitId,
        critical: false,
      })
      console.log(`✅ Запланировано одноразовое напоминание на ${notificationTime.toLocaleString('ru-RU')}`)
    } else if (frequency === 'daily') {
      // Ежедневные напоминания: создаем quantity уведомлений в день на 30 дней
      let notificationCount = 0

      for (let day = 0; day < 30; day++) {
        for (let intake = 0; intake < quantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          notificationTime.setDate(now.getDate() + day)

          // Пропускаем уведомления в прошлом
          if (notificationTime <= now) {
            continue
          }

          const intakeNumber = intake + 1
          const notificationId = `reminder-daily-${reminderId}-day${day}-intake${intake}`

          await notificationService.scheduleNotification(notificationId, {
            title,
            body: `Время принять: ${medicineNames} (прием ${intakeNumber} из ${quantity})`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              reminderId,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'daily',
              day: String(day),
              intake: String(intakeNumber),
              totalIntakes: String(quantity),
            },
            kitId: medicines[0].kitId,
            critical: false,
          })
          notificationCount++
        }
      }
      console.log(`✅ Запланировано ${notificationCount} ежедневных напоминаний (${quantity} раз в день на 30 дней)`)
    } else if (frequency === 'weekly') {
      // Еженедельные напоминания: создаем quantity уведомлений в неделю на 12 недель
      let notificationCount = 0

      for (let week = 0; week < 12; week++) {
        for (let intake = 0; intake < quantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          // Распределяем приемы равномерно в течение недели
          notificationTime.setDate(now.getDate() + (week * 7) + Math.floor((intake * 7) / quantity))

          // Пропускаем уведомления в прошлом
          if (notificationTime <= now) {
            continue
          }

          const intakeNumber = intake + 1
          const notificationId = `reminder-weekly-${reminderId}-week${week}-intake${intake}`

          await notificationService.scheduleNotification(notificationId, {
            title,
            body: `Время принять: ${medicineNames} (прием ${intakeNumber} из ${quantity} в неделю)`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              reminderId,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'weekly',
              week: String(week),
              intake: String(intakeNumber),
              totalIntakes: String(quantity),
            },
            kitId: medicines[0].kitId,
            critical: false,
          })
          notificationCount++
        }
      }
      console.log(`✅ Запланировано ${notificationCount} еженедельных напоминаний (${quantity} раз в неделю на 12 недель)`)
    }
  }

  const handleCreateReminder = async () => {
    if (selectedMedicines.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одно лекарство')
      return
    }

    // Если название не введено, используем название по умолчанию
    const medicineNames = selectedMedicines.map(m => m.name).join(', ')
    const defaultTitle = selectedMedicines.length === 1
      ? `Принять ${selectedMedicines[0].name}`
      : `Принять ${selectedMedicines.length} лекарств`
    const title = reminderTitle.trim() || defaultTitle

    try {
      // Создаем ОДНО напоминание для всех выбранных лекарств
      const timesToUse = frequency === 'once' ? [reminderTime] : reminderTimes.slice(0, quantity)

      // Сохраняем напоминание в БД
      const reminderId = await databaseService.createReminder({
        medicineIds: selectedMedicines.map(m => m.id),
        familyMemberId: selectedFamilyMember?.id,
        title,
        frequency,
        timesPerDay: timesToUse.length,
        time: JSON.stringify(timesToUse.map(t => ({
          hour: t.getHours(),
          minute: t.getMinutes()
        })))
      })

      // Создаем записи приемов на ближайшие дни
      const daysToCreate = frequency === 'once' ? 1 : frequency === 'daily' ? 30 : 84 // 12 недель

      for (let day = 0; day < daysToCreate; day++) {
        const date = new Date()
        date.setDate(date.getDate() + day)
        // Используем локальную дату без UTC
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const dayStr = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${dayStr}`

        for (const time of timesToUse) {
          const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
          await databaseService.createReminderIntake({
            reminderId,
            scheduledDate: dateStr,
            scheduledTime: timeStr
          })
        }
      }

      // Запланировать уведомления для всех лекарств напоминания
      await scheduleReminderNotifications({
        medicines: selectedMedicines,
        reminderId,
        title,
        times: timesToUse,
        frequency,
        quantity: frequency === 'once' ? 1 : quantity,
        familyMemberId: selectedFamilyMember?.id
      })

      const frequencyText = frequency === 'once' ? 'один раз' : frequency === 'daily' ? 'ежедневно' : 'еженедельно'

      let message = `Напоминания для ${selectedMedicines.length} ${selectedMedicines.length === 1 ? 'лекарства' : 'лекарств'} созданы!\n\n`
      message += `Лекарства: ${medicineNames}\n`
      message += `Частота: ${frequencyText}\n`

      if (frequency === 'once') {
        const timeStr = reminderTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        message += `Время: ${timeStr}`
      } else {
        message += `Приемов в ${frequency === 'daily' ? 'день' : 'неделю'}: ${quantity}\n`
        message += 'Время приемов:\n'
        for (let i = 0; i < quantity; i++) {
          const timeStr = reminderTimes[i].toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          message += `  ${i + 1}. ${timeStr}\n`
        }
      }

      Alert.alert('✅ Напоминание создано', message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ])
    } catch (error) {
      console.error('Failed to create reminders:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      Alert.alert('Ошибка', `Не удалось создать напоминание: ${errorMessage}`)
    }
  }

  const frequencyOptions = [
    { value: 'once', label: 'Один раз', icon: '📅' },
    { value: 'daily', label: 'Ежедневно', icon: '🔄' },
    { value: 'weekly', label: 'Еженедельно', icon: '📆' },
  ] as const

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка лекарств...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps='handled'
        style={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Добавить напоминание</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Настройте напоминание о приеме лекарства
          </Text>
        </View>

        {/* Выбор лекарств через picker */}
        <View style={styles.section}>
          <MedicinePicker
            fieldName='Лекарства'
            value={selectedMedicines}
            onChange={setSelectedMedicines}
            multiple={true}
          />
        </View>

        {/* Выбор члена семьи */}
        {selectedMedicines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.familyMemberHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Кто принимает?</Text>
              {familyMembers.length === 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('FamilyMembers')}
                  style={styles.addFamilyButton}
                >
                  <Text style={[styles.addFamilyButtonText, { color: colors.primary }]}>
                    + Добавить
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {familyMembers.length === 0 ? (
              <View style={styles.noFamilyContainer}>
                <Text style={[styles.noFamilyText, { color: colors.textSecondary }]}>
                  Нет членов семьи. Добавьте их, чтобы отслеживать кто принимает лекарства.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familyScroll}>
                <TouchableOpacity
                  style={[
                    styles.familyMemberCard,
                    {
                      borderColor: !selectedFamilyMember ? colors.primary : colors.border,
                      backgroundColor: !selectedFamilyMember ? colors.primary + '10' : 'white'
                    }
                  ]}
                  onPress={() => setSelectedFamilyMember(null)}
                >
                  <View style={[styles.familyAvatar, { backgroundColor: colors.border }]}>
                    <Text style={styles.familyAvatarText}>❓</Text>
                  </View>
                  <Text style={[styles.familyMemberName, { color: colors.text }]}>
                    Не указано
                  </Text>
                </TouchableOpacity>
                {familyMembers.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.familyMemberCard,
                      {
                        borderColor: selectedFamilyMember?.id === member.id ? colors.primary : colors.border,
                        backgroundColor: selectedFamilyMember?.id === member.id ? colors.primary + '10' : 'white'
                      }
                    ]}
                    onPress={() => setSelectedFamilyMember(member)}
                  >
                    <View style={[styles.familyAvatar, { backgroundColor: member.color || colors.primary }]}>
                      <Text style={styles.familyAvatarText}>{member.avatar || '👤'}</Text>
                    </View>
                    <Text style={[styles.familyMemberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Настройки напоминания */}
        {selectedMedicines.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Настройки</Text>

              <TextInput
                label='Название'
                value={reminderTitle}
                onChangeText={setReminderTitle}
                styleContainer={{ marginBottom: 24 }}
              />

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Частота</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        {
                          borderColor: frequency === option.value ? colors.primary : colors.border,
                          backgroundColor: frequency === option.value ? colors.primary + '10' : 'white'
                        }
                      ]}
                      onPress={() => setFrequency(option.value)}
                    >
                      <Text style={styles.frequencyIcon}>{option.icon}</Text>
                      <Text style={[styles.frequencyLabel, { color: colors.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {frequency !== 'once' && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Количество приемов</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={[styles.quantityButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Text style={[styles.quantityButtonText, { color: colors.text }]}>−</Text>
                    </TouchableOpacity>

                    <View style={[styles.quantityDisplay, { borderColor: colors.border }]}>
                      <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.quantityButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(Math.min(10, quantity + 1))}
                    >
                      <Text style={[styles.quantityButtonText, { color: colors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {frequency === 'once' ? (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Время</Text>
                  <DatePicker
                    value={reminderTime}
                    onChange={setReminderTime}
                    mode='time'
                    style={styles.timePicker}
                  />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Время приемов</Text>
                  {Array.from({ length: quantity }).map((_, index) => (
                    <View key={index} style={styles.timePickerContainer}>
                      <Text style={[styles.timePickerLabel, { color: colors.text }]}>
                        {index + 1}. Прием
                      </Text>
                      <DatePicker
                        value={reminderTimes[index]}
                        onChange={newTime => {
                          const newTimes = [...reminderTimes]
                          newTimes[index] = newTime
                          setReminderTimes(newTimes)
                        }}
                        mode='time'
                        style={styles.timePicker}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Кнопка создания */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateReminder}
              >
                <Text style={styles.createButtonText}>Создать напоминание</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О напоминаниях</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Напоминания будут приходить в указанное время{'\n'}
            • Для повторяющихся напоминаний можно указать количество{'\n'}
            • Ежедневные напоминания повторяются каждый день{'\n'}
            • Еженедельные напоминания повторяются каждую неделю{'\n'}
            • Можно отключить или изменить в любой момент
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
  },
  textInputText: {
    fontSize: FONT_SIZE.md,
  },
  timePicker: {
    marginVertical: SPACING.sm,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frequencyOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  frequencyIcon: {
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.xs,
  },
  frequencyLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  timePickerContainer: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  timePickerLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  createButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  familyMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addFamilyButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  addFamilyButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  noFamilyContainer: {
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  noFamilyText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  familyMemberCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  familyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  familyAvatarText: {
    fontSize: 28,
  },
  familyMemberName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
})

