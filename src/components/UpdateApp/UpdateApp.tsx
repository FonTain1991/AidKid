import { FONT_FAMILY, WIDTH } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { Linking, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import VersionCheck from 'react-native-version-check'
import { Button } from '../Button'
import { PaddingHorizontal } from '../Layout'
interface IProps {
  onHide: () => void
}

export function UpdateApp({ onHide }: IProps) {
  const { colors } = useTheme()
  const goToStore = () => {
    VersionCheck.getPlayStoreUrl({ packageName: 'com.aidkit' }).then(url => {
      Linking.canOpenURL(url).then((supported: boolean) => {
        if (supported) {
          Linking.openURL(url)
          onHide()
        }
      })
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon name='download-cloud' size={80} color={colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.primary }]}>Обновите приложение</Text>
      <Text style={[styles.description, { color: colors.muted }]}>Новая версия доступна для скачивания</Text>
      <PaddingHorizontal>
        <Button
          onPress={goToStore}
          title='Обновить'
          style={styles.buttonSecondary}
        />
        <Button
          onPress={onHide}
          title='Не сейчас'
          style={styles.buttonGhost}
          textStyle={{ color: colors.primary }}
        />
      </PaddingHorizontal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  iconWrapper: {
    marginBottom: 16
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 26
  },
  description: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: FONT_SIZE.md,
    lineHeight: 19,
    marginTop: 12,
    textAlign: 'center'
  },
  buttonSecondary: {
    marginTop: 20,
    width: WIDTH / 2
  },
  buttonGhost: {
    marginTop: 6,
    backgroundColor: 'transparent',
  }
})