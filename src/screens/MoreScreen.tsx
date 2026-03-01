import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import i18n, { LANGUAGES, setStoredLanguage } from '@/i18n'
import { useEvent, useMyNavigation, useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTheme } from '@/providers/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useSubscription } from '@/components/Subscription/hooks/useSubscription'

export function MoreScreen() {
  const { colors } = useTheme()
  const { navigate } = useMyNavigation()
  const { isPremium } = useSubscription()
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.more'),
    },
  })

  useNavigationBarColor()

  const handleLanguageSelect = useEvent(() => {
    Alert.alert(
      t('moreMenu.language'),
      t('moreMenu.languageDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' as const },
        ...LANGUAGES.map(({ code, label }) => ({
          text: label,
          onPress: async () => {
            await setStoredLanguage(code)
            await i18n.changeLanguage(code)
          },
        })),
      ]
    )
  })

  const handleShowOnboarding = useEvent(() => {
    Alert.alert(
      t('onboardingAlert.showAgain'),
      t('onboardingAlert.showAgainConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.show'),
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@onboarding_completed')
              Alert.alert(t('onboardingAlert.done'), t('onboardingAlert.restartMessage'))
            } catch (error) {
              console.error('Failed to reset onboarding:', error)
              Alert.alert(t('onboardingAlert.error'), t('onboardingAlert.failedToReset'))
            }
          },
        },
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
        Alert.alert(t('support.error'), t('support.failedToOpenTelegram'))
      }
    } catch (error) {
      console.error('Failed to open Telegram:', error)
      Alert.alert(t('support.error'), t('support.failedToOpenLink'))
    }
  })

  const menuItems = useMemo(
    () => [
      {
        title: t('moreMenu.language'),
        description: t('moreMenu.languageDesc'),
        icon: '🌐',
        onPress: handleLanguageSelect,
      },
      {
        title: t('moreMenu.premium'),
        description: t('moreMenu.premiumDesc'),
        icon: '💎',
        onPress: () => navigate('subscription'),
      },
      {
        title: t('moreMenu.shoppingList'),
        description: t('moreMenu.shoppingListDesc'),
        icon: '🛒',
        onPress: () => navigate('shoppingList'),
      },
      {
        title: t('moreMenu.familyMembers'),
        description: t('moreMenu.familyMembersDesc'),
        icon: '👨‍👩‍👧‍👦',
        onPress: () => navigate('familyMembers'),
      },
      {
        title: t('moreMenu.notifications'),
        description: t('moreMenu.notificationsDesc'),
        icon: '🔔',
        onPress: () => navigate('notificationSettings'),
      },
      {
        title: t('moreMenu.backup'),
        description: t('moreMenu.backupDesc'),
        icon: '💾',
        onPress: () => {
          if (isPremium) {
            navigate('backup')
            return
          }
          navigate('subscribe')
        },
      },
      {
        title: t('moreMenu.support'),
        description: t('moreMenu.supportDesc'),
        icon: '💬',
        onPress: handleSupport,
      },
      {
        title: t('moreMenu.about'),
        description: t('moreMenu.aboutDesc'),
        icon: '💡',
        onPress: handleShowOnboarding,
      },
    ],
    [navigate, handleShowOnboarding, handleSupport, handleLanguageSelect, isPremium, t]
  )

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
                {t('app.name')} v{DeviceInfo.getVersion()}
              </Text>
              <Text style={[styles.copyright, { color: colors.muted }]}>
                © {new Date().getFullYear()}. {t('footer.allRightsReserved')}
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