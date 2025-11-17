import { useContext } from 'react'
import { RouteProp, useRoute as useNavigationRoute } from '@react-navigation/native'
import { RouteParamsContext } from '@/app/providers/RouteParams'

export const useRoute = (): RouteProp<any> => {
  try {
    const bottomSheetRoute = useContext(RouteParamsContext)
    if (bottomSheetRoute) {
      return bottomSheetRoute
    }
    return useNavigationRoute()
  } catch (error) {
    return useNavigationRoute()
  }
}
