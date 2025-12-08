import { FONT_SIZE } from '@/constants/font'
import { useEvent } from '@/hooks'
import { forwardRef, useImperativeHandle } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import prompt from 'react-native-prompt-android'
import { Checkbox } from '../Form'
import { Text } from '../Text'

interface DosageProps {
  onChange?: (value: string) => void
  unit: string
  dosage: string
  isChecked: boolean
  quantity: number
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

export const Dosage = forwardRef(({ onChange, unit, dosage, isChecked, quantity }: DosageProps, ref) => {
  const showPrompt = useEvent(() => {
    const defaultDosage = getDefaultDosage(unit)
    const buttons = [
      {
        text: 'Отмена', onPress: () => {
          if (dosage) {
            return
          }
          onChange?.('')
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

          if (Number(trimmedDosage) > quantity) {
            Alert.alert('Ошибка', `Пожалуйста, введите дозировку меньше либо равную ${quantity}`, [
              { text: 'OK', onPress: () => showPrompt() }
            ])
            return
          }

          onChange?.(trimmedDosage)
        }
      },
    ]
    if (dosage) {
      buttons.unshift({
        text: 'Очистить', onPress: () => {
          onChange?.('')
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

  useImperativeHandle(ref, () => ({
    clearDosage: () => {
      onChange?.('')
    },
  }))

  return (
    <View>
      {!dosage && (
        <Checkbox value={isChecked} onChange={() => showPrompt()} />
      )}
      {dosage && <Text onPress={showPrompt} style={styles.text}>Количество:{'\n'}<Text style={{ textDecorationLine: 'underline' }}>{dosage}</Text></Text>}
    </View>
  )
})

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center'
  },
})