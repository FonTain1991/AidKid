import type { RootStackParamList } from '@/app/navigation/types'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Linking } from 'react-native'
import { displayName } from '../../../app.json'
import DeviceInfo from 'react-native-device-info'
import AsyncStorage from '@react-native-async-storage/async-storage'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function MoreScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const handleShowOnboarding = async () => {
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
  }

  const handleSupport = async () => {
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
  }

  const menuItems = [
    {
      title: 'Список покупок',
      description: 'Список лекарств для покупки',
      icon: '🛒',
      onPress: () => {
        navigation.navigate('ShoppingList')
      },
    },
    {
      title: 'Члены семьи',
      description: 'Управление членами семьи',
      icon: '👨‍👩‍👧‍👦',
      onPress: () => {
        navigation.navigate('FamilyMembers')
      },
    },
    {
      title: 'Настройки уведомлений',
      description: 'Управление уведомлениями о лекарствах',
      icon: '🔔',
      onPress: () => {
        navigation.navigate('NotificationSettings')
      },
    },
    {
      title: 'Резервное копирование',
      description: 'Синхронизация и экспорт данных',
      icon: '💾',
      onPress: () => {
        navigation.navigate('Backup')
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
  ]

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={styles.section}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
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
                    <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                  <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            {displayName} v{DeviceInfo.getVersion()}
          </Text>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>
            © {new Date().getFullYear()}. Все права защищены.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  section: {
    marginTop: SPACING.md,
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
    marginTop: 40,
  },
  version: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  copyright: {
    fontSize: FONT_SIZE.sm,
  },
})
