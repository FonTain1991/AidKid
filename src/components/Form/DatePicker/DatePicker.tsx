import dayjs from 'dayjs'
import React, { useState } from 'react'
import DatePickerModal from 'react-native-date-picker'
import { ListButton } from '../ListButton'

interface DatePickerProps {
  fieldName?: string
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  mode?: 'date' | 'time' | 'datetime'
  maximumDate?: Date
  minimumDate?: Date
  error?: string | null | undefined
}

export const DatePicker: React.FC<DatePickerProps> = ({
  fieldName,
  value,
  onChange,
  disabled = false,
  mode = 'date',
  maximumDate,
  minimumDate,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <>
      <ListButton
        fieldName={fieldName}
        value={value ? dayjs(+value).format('DD.MM.YYYY') : undefined}
        onPress={handlePress}
        disabled={disabled}
        showArrow={false}
        error={error}
      />

      <DatePickerModal
        modal
        open={isOpen}
        date={value ? new Date(+value) : new Date()}
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
