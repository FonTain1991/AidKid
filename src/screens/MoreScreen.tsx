import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useEvent, useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTheme } from '@/providers/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMemo } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { displayName } from '../../app.json'
import { useSubscription } from '@/components/Subscription/hooks/useSubscription'

export function MoreScreen() {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()
  const { isPremium } = useSubscription()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Еще'
    }
  })

  useNavigationBarColor()
  const handleShowOnboarding = useEvent(() => {
    Alert.alert(
      'Показать знакомство',
      'Хотите посмотреть приветственные экраны снова?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Показать',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@onboarding_completed')
              Alert.alert(
                'Готово',
                'Перезапустите приложение, чтобы увидеть приветственные экраны'
              )
            } catch (error) {
              console.error('Failed to reset onboarding:', error)
              Alert.alert('Ошибка', 'Не удалось сбросить настройки')
            }
          }
        }
      ]
    )
  })

  const handleSupport = useEvent(async () => {
    const telegramUrl = 'https://t.me/+ZppyHhxkvdgxMDMy'
    try {
      const canOpen = await Linking.canOpenURL(telegramUrl)
      if (canOpen) {
        await Linking.openURL(telegramUrl)
      } else {
        Alert.alert('Ошибка', 'Не удалось открыть Telegram')
      }
    } catch (error) {
      console.error('Failed to open Telegram:', error)
      Alert.alert('Ошибка', 'Не удалось открыть ссылку')
    }
  })

  const menuItems = useMemo(() => [
    {
      title: 'Премиум подписка',
      description: 'Откройте все возможности приложения',
      icon: '💎',
      onPress: () => {
        navigate('subscription')
      },
    },
    {
      title: 'Список покупок',
      description: 'Список лекарств для покупки',
      icon: '🛒',
      onPress: () => {
        navigate('shoppingList')
      },
    },
    {
      title: 'Члены семьи',
      description: 'Управление членами семьи',
      icon: '👨‍👩‍👧‍👦',
      onPress: () => {
        navigate('familyMembers')
      },
    },
    {
      title: 'Настройки уведомлений',
      description: 'Управление уведомлениями о лекарствах',
      icon: '🔔',
      onPress: () => {
        navigate('notificationSettings')
      },
    },
    {
      title: 'Резервное копирование',
      description: 'Синхронизация и экспорт данных',
      icon: '💾',
      onPress: () => {
        console.log('isPremium', isPremium)
        if (isPremium) {
          navigate('backup')
          return
        }
        navigate('subscribe')
      },
    },
    {
      title: 'Поддержка',
      description: 'Задать вопрос или сообщить о проблеме',
      icon: '💬',
      onPress: handleSupport,
    },
    {
      title: 'О приложении',
      description: 'Повторно показать приветственные экраны',
      icon: '💡',
      onPress: handleShowOnboarding,
    },
  ], [navigate, handleShowOnboarding, handleSupport])

  return (
    <SafeAreaView edges={[]}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            contentContainerStyle={styles.contentContainer}
          >
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuDescription, { color: colors.muted }]}>
                      {item.description}
                    </Text>
                  </View>
                  <Text style={[styles.menuArrow, { color: colors.muted }]}>›</Text>
                </View>
              </Pressable>
            ))}
            <View style={styles.footer}>
              <Text style={[styles.version, { color: colors.muted }]}>
                {displayName} v{DeviceInfo.getVersion()}
              </Text>
              <Text style={[styles.copyright, { color: colors.muted }]}>
                © {new Date().getFullYear()}. Все права защищены.
              </Text>
            </View>
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {

  },
  menuItem: {
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  menuIcon: {
    fontSize: FONT_SIZE.xl,
    marginRight: SPACING.md,
    width: 32,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  menuDescription: {
    fontSize: FONT_SIZE.sm,
  },
  menuArrow: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  footer: {
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  version: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  copyright: {
    fontSize: FONT_SIZE.sm,
  }
})