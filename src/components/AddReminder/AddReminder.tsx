
import { FREQUENCY_OPTIONS, SPACING } from '@/constants'
import { getValuesForList } from '@/helpers'
import { useMyNavigation, useReminder, useReminderMedicine } from '@/hooks'
import { useEvent } from '@/hooks/useEvent'
import { notificationService } from '@/lib'
import { Medicine } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { AboutScreen } from '../AboutScreen'
import { Button } from '../Button'
import { EmptyList } from '../EmptyList'
import { FormItemWrapper, List, MultiList, Textarea, TextInput } from '../Form'
import { Counter } from '../Form/Counter'
import { DatePicker } from '../Form/DatePicker'
import { PaddingHorizontal } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'

interface ReminderFormType {
  selectedMedicineIds: number[]
  selectedFamilyMember: number | null
  reminderTitle: string
  reminderTime: Date
  reminderTimes: Date[]
  frequency: 'once' | 'daily' | 'weekly'
  quantity: number
  daysCount: number
  description: string
  dosage: string
}

export const AddReminder = memo(() => {
  const styles = useStyles()
  const navigation = useMyNavigation()
  const { medicines, familyMembers } = useAppStore(state => state)

  const { createReminder } = useReminder()
  const { createReminderMedicine } = useReminderMedicine()

  const [errors, setErrors] = useState<{ medicine?: string; familyMember?: string; dosage?: string }>({})
  const [_isEnabled, _setIsEnabled] = useState(true)
  const [reminderForm, setReminderForm] = useState<ReminderFormType>({
    selectedMedicineIds: [],
    selectedFamilyMember: null,
    reminderTitle: '',
    reminderTime: new Date(),
    reminderTimes: [new Date(), new Date(), new Date()],
    frequency: 'once',
    quantity: 1,
    daysCount: 14,
    description: '',
    dosage: ''
  })


  const medicinesOptions = useMemo(() => getValuesForList(medicines), [medicines])
  const familyMembersOptions = useMemo(() => getValuesForList(familyMembers), [familyMembers])

  // Инициализируем время по умолчанию для разных приемов
  useEffect(() => {
    const defaultTimes: Date[] = []

    // Устанавливаем разное время для каждого приема
    // 1-й прием: 09:00, 2-й: 14:00, 3-й: 20:00, и т.д.
    const defaultHours = [9, 14, 20, 12, 16, 22, 10, 15, 18, 21]

    for (let i = 0; i < 10; i++) {
      const time = new Date()
      time.setHours(defaultHours[i] || (9 + (i * 2)), 0, 0, 0)
      defaultTimes.push(time)
    }

    setReminderForm(prev => ({ ...prev, reminderTimes: defaultTimes }))
  }, [])

  const scheduleReminderNotifications = useEvent(async (options: {
    medicines: Medicine[]
    reminderId: number
    title: string
    times: Date[]
    frequency: 'once' | 'daily' | 'weekly'
    quantity: number
    daysCount: number
    familyMemberId?: number
  }) => {
    const { medicines: reminderMedicines, reminderId, title, times, frequency: reminderFrequency, quantity: reminderQuantity, daysCount: reminderDaysCount, familyMemberId } = options
    const now = new Date()
    const medicineNames = reminderMedicines.map(m => m.name).join(', ')
    const medicineIds = reminderMedicines.map(m => m.id).filter((id): id is number => id !== null && id !== undefined)
    // Используем medicineKitId из первого лекарства, если нет - используем 1 (дефолтный канал)
    const medicineKitId = reminderMedicines[0]?.medicineKitId || 1

    const scheduleSingleNotification = async (params: {
      notificationId: string
      notificationTime: Date
      body: string
      data: any
    }): Promise<boolean> => {
      const { notificationId, notificationTime, body, data } = params
      if (notificationTime <= now) {
        return false
      }

      const result = await notificationService.scheduleNotification(notificationId, {
        title,
        body,
        notificationDate: notificationTime,
        data,
        medicineKitId,
        critical: false,
      })

      return result
    }

    if (reminderFrequency === 'once') {
      // Одноразовое напоминание - всегда 1 уведомление
      const notificationTime = new Date(times[0])
      notificationTime.setFullYear(now.getFullYear())
      notificationTime.setMonth(now.getMonth())
      notificationTime.setDate(now.getDate())

      // Если время уже прошло сегодня, планируем на завтра
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1)
      }

      const notificationId = `reminder-once-${reminderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const scheduled = await scheduleSingleNotification({
        notificationId,
        notificationTime,
        body: `Время принять: ${medicineNames}`,
        data: {
          type: 'reminder',
          reminderId,
          medicineIds: JSON.stringify(medicineIds),
          familyMemberId: familyMemberId || '',
          frequency: 'once',
        }
      })

      if (scheduled) {
        console.log(`Scheduled once reminder for ${notificationTime.toLocaleString('ru-RU')}`)
      }
    } else if (reminderFrequency === 'daily') {
      // Ежедневные напоминания: создаем quantity уведомлений в день на указанное количество дней
      const notificationPromises = []

      for (let day = 0; day < reminderDaysCount; day++) {
        for (let intake = 0; intake < reminderQuantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          notificationTime.setDate(now.getDate() + day)

          const intakeNumber = intake + 1
          const notificationId = `reminder-daily-${reminderId}-day${day}-intake${intake}`

          notificationPromises.push(scheduleSingleNotification({
            notificationId,
            notificationTime,
            body: `Время принять: ${medicineNames} (прием ${intakeNumber} из ${reminderQuantity})`,
            data: {
              type: 'reminder',
              reminderId,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'daily',
              day: String(day),
              intake: String(intakeNumber),
              totalIntakes: String(reminderQuantity),
            }
          }))
        }
      }

      const results = await Promise.all(notificationPromises)
      const notificationCount = results.filter(Boolean).length

      if (notificationCount > 0) {
        console.log(`Scheduled ${notificationCount} daily reminders`)
      }
    } else if (reminderFrequency === 'weekly') {
      // Еженедельные напоминания: создаем quantity уведомлений в неделю на указанное количество недель
      const weeksCount = Math.ceil(reminderDaysCount / 7)

      const notificationPromises = []
      for (let week = 0; week < weeksCount; week++) {
        for (let intake = 0; intake < reminderQuantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          // Распределяем приемы равномерно в течение недели
          notificationTime.setDate(now.getDate() + (week * 7) + Math.floor((intake * 7) / reminderQuantity))

          const intakeNumber = intake + 1
          const notificationId = `reminder-weekly-${reminderId}-week${week}-intake${intake}`

          notificationPromises.push(scheduleSingleNotification({
            notificationId,
            notificationTime,
            body: `Время принять: ${medicineNames} (прием ${intakeNumber} из ${reminderQuantity} в неделю)`,
            data: {
              type: 'reminder',
              reminderId,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'weekly',
              week: String(week),
              intake: String(intakeNumber),
              totalIntakes: String(reminderQuantity),
            }
          }))
        }
      }

      const results = await Promise.all(notificationPromises)
      const notificationCount = results.filter(Boolean).length

      if (notificationCount > 0) {
        console.log(`Scheduled ${notificationCount} weekly reminders`)
      }
    }
  })

  const handleCreateReminder = useEvent(async () => {
    const errorsFields: { medicine?: string; familyMember?: string; dosage?: string } = {}
    if (!reminderForm.selectedMedicineIds.length) {
      errorsFields.medicine = 'Выберите хотя бы одно лекарство'
    }

    if (!reminderForm.dosage) {
      errorsFields.dosage = 'Выберите дозировку'
    }

    if (!reminderForm.selectedFamilyMember) {
      errorsFields.familyMember = 'Выберите члена семьи'
    }

    if (Object.keys(errorsFields).length) {
      setErrors(errorsFields)
      return
    }
    setErrors({})

    // Проверяем и запрашиваем разрешение на уведомления
    const hasPermission = await notificationService.checkPermission()
    if (!hasPermission) {
      const granted = await notificationService.requestPermission()
      if (!granted) {
        Alert.alert(
          'Требуется разрешение',
          'Для работы напоминаний необходимо разрешение на отправку уведомлений',
          [
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        )
        return
      }
    }


    // Если название не введено, используем название по умолчанию
    const selectedMedicines = medicines.filter(m => reminderForm.selectedMedicineIds.includes(m.id!))
    const medicineNames = selectedMedicines.map(m => m.name).join(', ')
    const defaultTitle = selectedMedicines.length === 1
      ? `Принять ${selectedMedicines[0].name}`
      : `Принять ${selectedMedicines.length} лекарств`
    const title = reminderForm.reminderTitle.trim() || defaultTitle

    try {
      // Создаем ОДНО напоминание для всех выбранных лекарств
      const timesToUse = reminderForm.frequency === 'once'
        ? [reminderForm.reminderTime]
        : reminderForm.reminderTimes.slice(0, reminderForm.quantity)

      // Формируем строку времени для БД
      const timeString = JSON.stringify(timesToUse.map(t => ({
        hour: t.getHours(),
        minute: t.getMinutes()
      })))

      const reminder = await createReminder({
        familyMemberId: reminderForm.selectedFamilyMember,
        title,
        frequency: reminderForm.frequency,
        timesPerDay: reminderForm.quantity,
        time: timeString,
        isActive: true,
        description: reminderForm.description
      })
      console.log('Created reminder:', reminder)
      if (!reminder || !reminder.id) {
        throw new Error('Не удалось создать напоминание')
      }

      const reminderId = reminder.id
      console.log('Reminder ID:', reminderId, 'Type:', typeof reminderId)

      // Создаем связи между напоминанием и лекарствами
      await Promise.all(reminderForm.selectedMedicineIds.map(medicineId => createReminderMedicine({
        reminderId,
        medicineId
      })))

      // Запланировать уведомления для всех лекарств напоминания
      await scheduleReminderNotifications({
        medicines: selectedMedicines,
        reminderId: reminderId,
        title,
        times: timesToUse,
        frequency: reminderForm.frequency,
        quantity: reminderForm.frequency === 'once' ? 1 : reminderForm.quantity,
        daysCount: reminderForm.frequency === 'once' ? 1 : reminderForm.daysCount,
        familyMemberId: reminderForm.selectedFamilyMember?.value
      })

      const frequencyText = reminderForm.frequency === 'once'
        ? 'один раз'
        : reminderForm.frequency === 'daily'
          ? 'ежедневно'
          : 'еженедельно'

      let message = `Напоминания для ${selectedMedicines.length} ${selectedMedicines.length === 1 ? 'лекарства' : 'лекарств'} созданы!\n\n`
      message += `Лекарства: ${medicineNames}\n`
      message += `Частота: ${frequencyText}\n`

      if (reminderForm.frequency === 'once') {
        const timeStr = reminderForm.reminderTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        message += `Время: ${timeStr}`
      } else {
        message += `Приемов в ${reminderForm.frequency === 'daily' ? 'день' : 'неделю'}: ${reminderForm.quantity}\n`
        message += `Количество дней: ${reminderForm.daysCount}\n`
        message += 'Время приемов:\n'
        for (let i = 0; i < reminderForm.quantity; i++) {
          const timeStr = reminderForm.reminderTimes[i].toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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
  })

  const onMedicineChange = (selectedMedicineIds: number[]) => {
    setReminderForm(prev => ({ ...prev, selectedMedicineIds: selectedMedicineIds as number[] }))
    setErrors(prev => ({ ...prev, medicine: undefined }))
  }
  const onFamilyMemberChange = (selectedFamilyMember: { label: string; value: number } | null) => {
    setReminderForm(prev => ({ ...prev, selectedFamilyMember }))
    setErrors(prev => ({ ...prev, familyMember: undefined }))
  }

  const isOnce = reminderForm.frequency === 'once'

  return (
    <>
      <PaddingHorizontal>
        <FormItemWrapper>
          <EmptyList
            onPress={() => navigation.navigate('medicine')}
            title='Лекарства не найдены.'
            options={medicinesOptions}
            error={errors?.medicine}
          >
            <MultiList
              options={medicinesOptions}
              fieldName='Лекарство'
              value={reminderForm.selectedMedicineIds}
              onChange={onMedicineChange}
              error={errors?.medicine}
            />
          </EmptyList>
        </FormItemWrapper>
        {!!reminderForm.selectedMedicineIds?.length && (
          <FormItemWrapper>
            <TextInput
              label='Дозировка'
              style={{ flexGrow: 1, flexShrink: 0, flex: 1 }}
              onChangeText={dosage => setReminderForm(prev => ({ ...prev, dosage }))}
              value={reminderForm.dosage}
              error={errors?.dosage}
            />
          </FormItemWrapper>
        )}
        <FormItemWrapper>
          <EmptyList
            onPress={() => navigation.navigate('familyMember')}
            title='Члены семьи не найдены.'
            options={familyMembersOptions}
            error={errors?.familyMember}
          >
            <List
              options={familyMembersOptions}
              fieldName='Член семьи'
              value={reminderForm.selectedFamilyMember}
              onChange={onFamilyMemberChange}
              error={errors?.familyMember}
            />
          </EmptyList>
        </FormItemWrapper>
        <FormItemWrapper>
          <TextInput
            label='Название'
            value={reminderForm.reminderTitle}
            onChangeText={reminderTitle => setReminderForm(prev => ({ ...prev, reminderTitle }))}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <Textarea
            label='Описание'
            value={reminderForm.description}
            onChangeText={description => setReminderForm(prev => ({ ...prev, description }))}
          />
        </FormItemWrapper>
        <FormItemWrapper>
          <List
            options={FREQUENCY_OPTIONS}
            fieldName='Частота'
            value={reminderForm.frequency}
            onChange={frequency => setReminderForm(prev => ({ ...prev, frequency }))}
          />
        </FormItemWrapper>
        {isOnce && (
          <FormItemWrapper>
            <DatePicker
              fieldName='Время'
              value={reminderForm.reminderTime}
              onChange={reminderTime => setReminderForm(prev => ({ ...prev, reminderTime }))}
              mode='time'
            />
          </FormItemWrapper>
        )}
        {!isOnce && (
          <>
            <FormItemWrapper>
              <Counter
                value={reminderForm.quantity}
                onChange={quantity => setReminderForm(prev => ({ ...prev, quantity }))}
                label='Количество приемов'
              />
            </FormItemWrapper>
            <>
              <Text style={styles.inputLabel}>Время приемов</Text>
              {Array.from({ length: reminderForm.quantity }).map((_, index) => (
                <FormItemWrapper key={`time-picker-${index}`}>
                  <Text style={styles.timePickerLabel}>
                    {index + 1}. Прием
                  </Text>
                  <DatePicker
                    fieldName='Выберите время'
                    value={reminderForm.reminderTimes[index]}
                    onChange={newTime => {
                      const newTimes = [...reminderForm.reminderTimes]
                      newTimes[index] = newTime
                      setReminderForm(prev => ({ ...prev, reminderTimes: newTimes }))
                    }}
                    mode='time'
                  />
                </FormItemWrapper>
              ))}
            </>
            <FormItemWrapper>
              <Counter
                value={reminderForm.daysCount}
                onChange={daysCount => setReminderForm(prev => ({ ...prev, daysCount }))}
                label='Количество дней'
              />
            </FormItemWrapper>
          </>
        )}
        <Button
          title='Создать напоминание'
          onPress={handleCreateReminder}
        />
      </PaddingHorizontal >
      <AboutScreen
        title='О напоминаниях'
        text={'• Напоминания будут приходить в указанное время\n• Для повторяющихся напоминаний можно указать количество приемов и дней\n• Ежедневные напоминания повторяются каждый день на указанное количество дней\n• Еженедельные напоминания повторяются каждую неделю\n• Можно отключить в любой момент'}
        style={{ marginTop: SPACING.md }}
      />
    </>
  )
})