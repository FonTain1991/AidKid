import { ReactNode } from 'react'
import { databaseService } from '@/shared/lib'

interface DatabaseProviderProps {
  children: ReactNode
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  // Здесь можно добавить логику инициализации базы данных
  // если нужно на уровне провайдера
  return <>{children}</>
}
