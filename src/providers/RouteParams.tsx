import { RouteProp } from '@react-navigation/native'
import { createContext, ReactNode } from 'react'


type RouteParamsContextType = RouteProp<any>

export const RouteParamsContext = createContext<RouteParamsContextType | undefined>(undefined)

interface RouteParamsProviderProps {
  children: ReactNode
  route: RouteProp<any>
}

export const RouteParamsProvider = ({ children, route }: RouteParamsProviderProps) => {
  return (
    <RouteParamsContext.Provider value={route}>
      {children}
    </RouteParamsContext.Provider>
  )
}
