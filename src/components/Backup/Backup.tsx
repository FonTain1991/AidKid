import { memo } from 'react'
import { View } from 'react-native'
import { LocalBackups } from './LocalBackups'
import { GoogleDriveBackups } from './GoogleDriveBackups'

export const Backup = memo(() => {
  return (
    <View>
      <LocalBackups />
      <GoogleDriveBackups />
    </View>
  )
})