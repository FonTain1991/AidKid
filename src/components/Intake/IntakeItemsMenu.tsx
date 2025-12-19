import { memo, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '../Text'
import { useMyNavigation } from '@/hooks'
import { useItemMenuStyles } from './useItemMenuStyles'

export const IntakeItemsMenu = memo(() => {
  const { navigate } = useMyNavigation()
  const styles = useItemMenuStyles()

  const intakeItems = useMemo(() => [
    {
      title: 'Сегодня',
      description: 'Запланированные приемы на сегодня',
      icon: '📅',
      count: 0,
      onPress: () => {
        navigate('today')
      },
    },
    {
      title: 'Напоминания',
      description: 'Настройка напоминаний о приеме',
      icon: '⏰',
      count: 0,
      onPress: () => {
        navigate('reminders')
      },
    },
    {
      title: 'История',
      description: 'Все записи о приемах лекарств',
      icon: '📋',
      count: 0,
      onPress: () => {
        navigate('history')
      },
    },
    {
      title: 'Статистика',
      description: 'Анализ приема лекарств',
      icon: '📊',
      count: 0,
      onPress: () => {
        navigate('statistics')
      },
    }
  ], [navigate])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Разделы</Text>

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