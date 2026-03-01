import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { Text } from '../Text'
import { useMyNavigation } from '@/hooks'
import { useItemMenuStyles } from './useItemMenuStyles'

export const IntakeItemsMenu = memo(() => {
  const { t } = useTranslation()
  const { navigate } = useMyNavigation()
  const styles = useItemMenuStyles()

  const intakeItems = useMemo(
    () => [
      {
        title: t('intakeMenu.today'),
        description: t('intakeMenu.todayDesc'),
        icon: '📅',
        count: 0,
        onPress: () => navigate('today'),
      },
      {
        title: t('intakeMenu.reminders'),
        description: t('intakeMenu.remindersDesc'),
        icon: '⏰',
        count: 0,
        onPress: () => navigate('reminders'),
      },
      {
        title: t('intakeMenu.history'),
        description: t('intakeMenu.historyDesc'),
        icon: '📋',
        count: 0,
        onPress: () => navigate('history'),
      },
      {
        title: t('intakeMenu.statistics'),
        description: t('intakeMenu.statisticsDesc'),
        icon: '📊',
        count: 0,
        onPress: () => navigate('statistics'),
      },
    ],
    [navigate, t]
  )

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('sections')}</Text>

      {intakeItems.map((item, index) => (
        <Pressable
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                {item.title}
              </Text>
              <Text style={styles.menuDescription}>
                {item.description}
              </Text>
            </View>
            <View style={styles.menuRight}>
              {item.count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.count}</Text>
                </View>
              )}
              <Text style={styles.menuArrow}>›</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  )
})