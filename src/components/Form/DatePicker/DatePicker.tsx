import i18n from '@/i18n'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const locale = i18n.language === 'ru' ? 'ru' : 'en'

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
        value={value ? dayjs(+value).format(mode === 'time' ? 'HH:mm' : 'DD.MM.YYYY') : undefined}
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
        title={fieldName || t('common.chooseDate')}
        confirmText={t('common.select')}
        cancelText={t('common.cancel')}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        locale={locale}
        theme='light'
        is24hourSource='locale'
      />
    </>
  )
}
