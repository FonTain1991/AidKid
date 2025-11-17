import { SPACING } from '@/constants'
import { memo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from '../Button'
import { ColorPicker, Textarea, TextInput } from '../Form'
import { Padding } from '../Layout'
import { ParentMedicineKitList } from '../ParentMedicineKitList'

export const MedicineKitForm = memo(() => {
  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      nestedScrollEnabled
    >
      <Padding style={{ gap: SPACING.md }}>
        <TextInput
          label='Название'
        // onChangeText={onChangeText}
        // value={medicineKit.name}
        />
        <Textarea
          label='Описание'
        // onChangeText={onChangeText}
        // value={medicineKit.description}
        />
        <ColorPicker
          fieldName='Цвет'
          value='#3A944E'
        // value={medicineKit.color}
        // onColorSelect={onColorSelect}
        />
        <ParentMedicineKitList
          fieldName='Родительская категория'
        // value={medicineKit.parent_id}
        // onChange={onChangeParentMedicineKit}
        />
        <Button
          title='Добавить'
        // onPress={onSubmit}
        />
      </Padding>
    </ScrollView>
  )
})

export const styles = StyleSheet.create({

})