import { SPACING } from '@/constants'
import { useEvent, useRoute, useMyNavigation } from '@/hooks'
import { useMedicineKit } from '@/hooks/useMedicineKit'
import { MedicineKit } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ScrollView } from 'react-native'
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
  const { t } = useTranslation()
  const { params } = useRoute()
  const navigation = useMyNavigation()
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
      setErrorName(t('medicineKit.nameRequired'))
      return
    }
    setErrorName(null)
    try {
      if (params?.medicineKitId) {
        await updateMedicineKit({
          id: params?.medicineKitId,
          ...medicineKit,
        })
      } else {
        await createMedicineKit(medicineKit)
        setMedicineKit(INITIAL_MEDICINE_KIT)
      }
      navigation.goBack()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('medicineKit.failedToCreate')
      Alert.alert(
        t('medicineKit.limitReached'),
        errorMessage,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.subscribe'),
            onPress: () => navigation.navigate('subscription'),
          },
        ]
      )
    }
  })

  useEffect(() => {
    if (params?.medicineKitId) {
      const kit = medicineKits.find((medicineKit: MedicineKit) => medicineKit.id === params?.medicineKitId)
      if (kit) {
        setMedicineKit(kit)
      }
    }
  }, [params?.medicineKitId, medicineKits])

  useEffect(() => {
    if (params?.parentId) {
      setMedicineKit(prev => ({ ...prev, parentId: params.parentId }))
    }
  }, [params?.parentId])

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      nestedScrollEnabled
    >
      <Padding style={{ gap: SPACING.md }}>
        <TextInput
          label={t('medicineKit.name')}
          onChangeText={onChangeName}
          value={medicineKit.name}
          error={errorName ?? undefined}
        />
        <Textarea
          label={t('medicineKit.description')}
          onChangeText={onChangeDescription}
          value={medicineKit.description}
        />
        <ColorPicker
          fieldName={t('medicineKit.color')}
          value={medicineKit.color}
          onColorSelect={onChangeColor}
        />
        <ParentMedicineKitList
          fieldName={t('medicineKit.parentCategory')}
          value={medicineKit?.parentId}
          onChange={onChangeParentMedicineKit}
        />
        <Button
          title={params?.medicineKitId ? t('common.save') : t('medicine.add')}
          onPress={onSubmit}
        />
      </Padding>
    </ScrollView>
  )
})