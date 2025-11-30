import { useMyNavigation } from '@/hooks'
import { useAppStore } from '@/store'
import { useEffect } from 'react'
import { Alert } from 'react-native'

export const useCheckExistsFamilyMember = () => {
  const { familyMembers } = useAppStore(state => state)
  const { navigate, replace } = useMyNavigation()

  useEffect(() => {
    if (familyMembers.length) {
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
  }, [familyMembers, navigate, replace])
}