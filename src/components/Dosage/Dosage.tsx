import { useEvent } from '@/hooks'
import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import prompt from 'react-native-prompt-android'
import { Checkbox } from '../Form'
import { Text } from '../Text'
import { FONT_SIZE } from '@/constants/font'

interface DosageProps {
  onChange?: (value: string) => void
  unit: string
}

export interface DosageRef {
  clearDosage: () => void
}

// Функция для получения приблизительной дозировки на основе единицы измерения
const getDefaultDosage = (unit?: string): string => {
  if (!unit) {
    return ''
  }

  const defaultDosages: Record<string, string> = {
    mg: '500 мг', // 500 мг (полграмма)
    ml: '5 мл', // 5 мл
    g: '1 грамм', // 1 грамм
    pcs: '1 штука', // 1 штука
    pack: '1 таблетка', // 1 таблетка
  }

  return defaultDosages[unit] || ''
}

export const Dosage = forwardRef(({ onChange, unit }: DosageProps, ref) => {
  const [isChecked, setIsChecked] = useState(false)
  const [dosage, setDosage] = useState('')

  const showPrompt = useEvent(() => {
    const defaultDosage = getDefaultDosage(unit)
    const buttons = [
      {
        text: 'Отмена', onPress: () => {
          if (dosage) {
            return
          }
          setIsChecked(false)
          onChange?.('')
          setDosage('')
        }, style: 'cancel'
      },
      {
        text: 'OK',
        onPress: (value: string) => {
          const trimmedDosage = value?.trim() || ''

          if (!trimmedDosage) {
            Alert.alert('Ошибка', 'Пожалуйста, введите дозировку', [
              { text: 'OK', onPress: () => showPrompt() }
            ])
            return
          }

          setDosage(trimmedDosage)
          onChange?.(trimmedDosage)
        }
      },
    ]
    if (dosage) {
      buttons.unshift({
        text: 'Очистить', onPress: () => {
          setIsChecked(false)
          onChange?.('')
          setDosage('')
        }, style: 'cancel'
      })
    }
    prompt(
      'Введите количество',
      '',
      buttons,
      {
        type: 'numeric',
        cancelable: false,
        defaultValue: dosage,
        placeholder: unit ? defaultDosage : '',
      }
    )
  })

  useEffect(() => {
    if (isChecked) {
      showPrompt()
    }
  }, [isChecked, showPrompt])

  useImperativeHandle(ref, () => ({
    clearDosage: () => {
      console.log('clearDosage')
      setIsChecked(false)
      onChange?.('')
      setDosage('')
    },
  }))

  return (
    <View>
      {!dosage && <Checkbox value={isChecked} onChange={setIsChecked} />}
      {dosage && <Text onPress={showPrompt} style={styles.text}>Количество:{'\n'}{dosage}</Text>}
    </View>
  )
})

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
})