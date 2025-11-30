import { SPACING } from '@/constants'
import { useEvent, useRoute } from '@/hooks'
import { useMedicineKit } from '@/hooks/useMedicineKit'
import { MedicineKit } from '@/services/models'
import { useAppStore } from '@/store'
import { useNavigation } from '@react-navigation/native'
import { memo, useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button } from '../Button'
import { ColorPicker, Textarea, TextInput } from '../Form'
import { Padding } from '../Layout'
import { ParentMedicineKitList } from '../ParentMedicineKitList'

const INITIAL_MEDICINE_KIT: MedicineKit = {
  color: '#3A944E',
  name: '',
  description: '',
  parentId: null,
}

export const MedicineKitForm = memo(() => {
  const { params } = useRoute()
  const { goBack } = useNavigation()
  const { medicineKits } = useAppStore(state => state)

  const { createMedicineKit, updateMedicineKit } = useMedicineKit()

  const [medicineKit, setMedicineKit] = useState<MedicineKit>(INITIAL_MEDICINE_KIT)

  const [errorName, setErrorName] = useState<string | null>(null)

  const onChangeName = useEvent((name: string) => {
    setMedicineKit({ ...medicineKit, name })
  })

  const onChangeColor = useEvent((color: string) => {
    setMedicineKit({ ...medicineKit, color })
  })

  const onChangeParentMedicineKit = useEvent((parentId: string) => {
    setMedicineKit({ ...medicineKit, parentId })
  })

  const onChangeDescription = useEvent((description: string) => {
    setMedicineKit({ ...medicineKit, description })
  })

  const onSubmit = useEvent(async () => {
    if (!medicineKit.name) {
      setErrorName('Название обязательно для заполнения')
      return
    }
    setErrorName(null)
    if (params?.medicineKitId) {
      await updateMedicineKit({
        id: params?.medicineKitId,
        ...medicineKit,
      })
    } else {
      await createMedicineKit(medicineKit)
      setMedicineKit(INITIAL_MEDICINE_KIT)
    }

    goBack()
  })

  useEffect(() => {
    if (params?.medicineKitId) {
      const kit = medicineKits.find((medicineKit: MedicineKit) => medicineKit.id === params?.medicineKitId)
      if (kit) {
        setMedicineKit(kit)
      }
    }
  }, [params?.medicineKitId, medicineKits])

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      nestedScrollEnabled
    >
      <Padding style={{ gap: SPACING.md }}>
        <TextInput
          label='Название'
          onChangeText={onChangeName}
          value={medicineKit.name}
          error={errorName ?? undefined}
        />
        <Textarea
          label='Описание'
          onChangeText={onChangeDescription}
          value={medicineKit.description}
        />
        <ColorPicker
          fieldName='Цвет'
          value={medicineKit.color}
          onColorSelect={onChangeColor}
        />
        <ParentMedicineKitList
          fieldName='Родительская категория'
          value={medicineKit?.parentId}
          onChange={onChangeParentMedicineKit}
        />
        <Button
          title={params?.medicineKitId ? 'Сохранить' : 'Добавить'}
          onPress={onSubmit}
        />
      </Padding>
    </ScrollView>
  )
})