import React, { useState } from 'react'
import { Platform } from 'react-native'
import DatePickerModal from 'react-native-date-picker'
import { ListButton } from '../ListButton'
import { useDatePickerStyles } from './useDatePickerStyles'

interface DatePickerProps {
  fieldName?: string
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  mode?: 'date' | 'time' | 'datetime'
  maximumDate?: Date
  minimumDate?: Date
}

export const DatePicker: React.FC<DatePickerProps> = ({
  fieldName,
  value,
  onChange,
  disabled = false,
  mode = 'date',
  maximumDate,
  minimumDate,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { styles } = useDatePickerStyles()

  const handlePress = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleDateChange = (date: Date) => {
    onChange?.(date)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const formatDate = (date?: Date) => {
    if (!date) {
      return ''
    }

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }

    if (mode === 'time') {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    if (mode === 'datetime') {
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return date.toLocaleDateString('ru-RU', options)
  }

  return (
    <>
      <ListButton
        fieldName={fieldName}
        value={value ? formatDate(value) : undefined}
        onPress={handlePress}
        disabled={disabled}
        style={styles.button}
        showArrow={false}
      />

      <DatePickerModal
        modal
        open={isOpen}
        date={value || new Date()}
        mode={mode}
        onConfirm={handleDateChange}
        onCancel={handleCancel}
        title={fieldName || 'Выберите дату'}
        confirmText='Выбрать'
        cancelText='Отмена'
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        locale='ru'
        theme='light'
      />
    </>
  )
}
