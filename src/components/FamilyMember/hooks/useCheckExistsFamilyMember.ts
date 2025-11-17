import { useFamilyMembers, useMyNavigation } from '@/hooks'
import { useEffect } from 'react'
import { Alert } from 'react-native'

export const useCheckExistsFamilyMember = () => {
  const { familyMembers, isLoading } = useFamilyMembers()
  const { navigate, replace } = useMyNavigation()

  useEffect(() => {
    if (familyMembers.length || !isLoading || (!familyMembers.length && isLoading)) {
      return
    }
    Alert.alert(
      'Внимание',
      'Для продолжения работы необходимо добавить хотя бы одного члена семьи',
      [
        {
          text: 'Отмена',
          style: 'cancel',
          onPress: () => replace('bottomNavigation', {
            screen: 'medicineKit'
          })
        },
        {
          text: 'Добавить',
          onPress: () => {
            navigate('familyMember', {
              referer: 'takingMedications'
            })
          }
        }
      ]
    )
  }, [familyMembers, isLoading, navigate, replace])
}