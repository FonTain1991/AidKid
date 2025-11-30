import React, { memo } from 'react'
import { Text as RNText, TextProps } from 'react-native'

export const Text = memo<TextProps>(props => {
  return (
    <RNText
      {...props}
      allowFontScaling={false}
    />
  )
})