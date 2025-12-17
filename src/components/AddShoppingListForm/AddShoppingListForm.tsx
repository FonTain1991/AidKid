import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useAppStore } from '@/store'
import { memo, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button } from '../Button'
import { AutoComplete, FormItemWrapper, Textarea } from '../Form'
import { Text } from '../Text'
import { useEvent, useShoppingList } from '@/hooks'
import { useNavigation } from '@react-navigation/native'

export const AddShoppingListForm = memo(() => {
  const { goBack } = useNavigation()
  const { createShoppingList } = useShoppingList()
  const { medicines, medicineKits } = useAppStore(state => state)
  const [data, setData] = useState({
    medicineName: '',
    description: ''
  })

  const options = useMemo(() => {
    return medicines.map(medicine => ({
      label: medicine.name,
      value: medicine.id,
      subTitle: medicineKits.find(kit => kit.id === medicine.medicineKitId)?.name
    }))
  }, [medicines, medicineKits])

  const handleSave = useEvent(async () => {
    try {

      await createShoppingList({
        medicineName: data.medicineName,
        description: data.description
      })
    } catch (error) {
      console.error(error)
    } finally {
      goBack()
    }
  })

  return (
    <View style={styles.field}>
      <FormItemWrapper>
        <AutoComplete
          options={options}
          value={data.medicineName}
          onChangeText={medicineName => setData({ ...data, medicineName })}
          label='Введите название лекарства'
        />
      </FormItemWrapper>
      <FormItemWrapper>
        <Textarea
          label='Описание'
          value={data.description}
          onChangeText={description => setData({ ...data, description })}
        />
      </FormItemWrapper>

      <View style={styles.helpText}>
        <Text style={styles.helpTextContent}>
          💡 Совет: Начните вводить название лекарства, и мы покажем подходящие варианты из вашей аптечки
        </Text>
      </View>

      <Button
        title={'Сохранить'}
        onPress={handleSave}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  form: {
    flex: 1
  },
  field: {
    marginBottom: SPACING.md
  },
  autoComplete: {
    zIndex: 1000
  },
  textArea: {
    minHeight: 80
  },
  helpText: {
    padding: SPACING.md,
    borderRadius: 12,
    // backgroundColor: colors.primary + '20', // 20% прозрачности
    marginBottom: SPACING.xl
  },
  helpTextContent: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    // color: colors.textSecondary
  }
})