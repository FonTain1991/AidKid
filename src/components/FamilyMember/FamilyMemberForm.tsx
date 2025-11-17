import { memo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { TextInput } from '../Form'
import { PaddingHorizontal } from '../Layout'
import { Avatar } from './Avatar'
import { SPACING } from '@/constants'
import { Colors } from './Colors'
import { Button } from '../Button'
import { FamilyMember } from '@/services/models'
import { useEvent, useMyNavigation, useRoute } from '@/hooks'
import { useFamilyMemberCreate } from '@/hooks/useFamilyMembers'

type CreateFamilyMemberPayload = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>

export const FamilyMemberForm = memo(() => {
  const [createFamilyMember] = useFamilyMemberCreate()
  const { params } = useRoute()
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

    const familyMember = await createFamilyMember(member)
    if (params?.referer && familyMember) {
      goBack()
    }
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