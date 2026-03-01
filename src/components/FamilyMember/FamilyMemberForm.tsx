import { SPACING } from '@/constants'
import { useTranslation } from 'react-i18next'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { FamilyMember } from '@/services/models'
import { memo, useEffect, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from '../Button'
import { TextInput } from '../Form'
import { PaddingHorizontal } from '../Layout'
import { Avatar } from './Avatar'
import { Colors } from './Colors'

type CreateFamilyMemberPayload = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>

export const FamilyMemberForm = memo(() => {
  const { t } = useTranslation()
  const { params } = useRoute()
  const { createFamilyMember, getFamilyMemberById, updateFamilyMember } = useFamilyMember()
  const { goBack } = useMyNavigation()

  const [member, setMember] = useState<CreateFamilyMemberPayload>({
    name: '',
    avatar: '',
    color: '',
  })

  const [error, setError] = useState<string | null>(null)

  const onSubmit = useEvent(async () => {
    if (member.name === '') {
      setError(t('familyMember.nameRequired'))
      return
    }

    if (params?.familyMemberId) {
      await updateFamilyMember({ id: params.familyMemberId, ...member })
    } else {
      await createFamilyMember(member)
    }
    goBack()
  })

  const onChangeText = useEvent((text: string) => {
    setMember({ ...member, name: text })
    setError(null)
  })

  useEffect(() => {
    if (params?.familyMemberId) {
      getFamilyMemberById(params.familyMemberId).then(result => {
        setMember({
          name: result?.name || '',
          avatar: result?.avatar || '',
          color: result?.color || '',
        })
      })
    }
  }, [getFamilyMemberById, params])

  return (
    <ScrollView
      keyboardShouldPersistTaps='always'
      contentContainerStyle={styles.form}
      nestedScrollEnabled
    >
      <Avatar onChange={avatar => setMember({ ...member, avatar })} value={member.avatar} />
      <PaddingHorizontal>
        <TextInput
          label={t('familyMember.name')}
          onChangeText={onChangeText}
          value={member.name}
          error={error ?? undefined}
        />
      </PaddingHorizontal>
      <Colors onChange={color => setMember({ ...member, color })} value={member.color} />
      <PaddingHorizontal>
        <Button
          title={params?.familyMemberId ? t('common.save') : t('medicine.add')}
          onPress={onSubmit}
        />
      </PaddingHorizontal>
    </ScrollView>
  )
})

export const styles = StyleSheet.create({
  form: {
    gap: SPACING.md,
    paddingTop: SPACING.md
  }
})