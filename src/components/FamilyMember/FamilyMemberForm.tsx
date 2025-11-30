import { SPACING } from '@/constants'
import { useEvent, useMyNavigation } from '@/hooks'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { FamilyMember } from '@/services/models'
import { memo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from '../Button'
import { TextInput } from '../Form'
import { PaddingHorizontal } from '../Layout'
import { Avatar } from './Avatar'
import { Colors } from './Colors'

type CreateFamilyMemberPayload = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>

export const FamilyMemberForm = memo(() => {
  const { createFamilyMember } = useFamilyMember()
  const { goBack } = useMyNavigation()

  const [member, setMember] = useState<CreateFamilyMemberPayload>({
    name: '',
    avatar: '',
    color: '',
  })

  const [error, setError] = useState<string | null>(null)

  const onSubmit = useEvent(async () => {
    if (member.name === '') {
      setError('Имя является обязательным полем')
      return
    }

    await createFamilyMember(member)
    goBack()
  })

  const onChangeText = useEvent((text: string) => {
    setMember({ ...member, name: text })
    setError(null)
  })

  return (
    <ScrollView
      contentContainerStyle={styles.form}
      nestedScrollEnabled
    >
      <Avatar onChange={avatar => setMember({ ...member, avatar })} value={member.avatar} />
      <PaddingHorizontal>
        <TextInput
          label='Имя'
          onChangeText={onChangeText}
          value={member.name}
          error={error ?? undefined}
        />
      </PaddingHorizontal>
      <Colors onChange={color => setMember({ ...member, color })} value={member.color} />
      <PaddingHorizontal>
        <Button
          title='Добавить'
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