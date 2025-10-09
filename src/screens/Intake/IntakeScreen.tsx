import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function IntakeScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const intakeItems = [
    {
      title: 'Сегодня',
      description: 'Запланированные приемы на сегодня',
      icon: '📅',
      count: 0,
      onPress: () => {
        navigation.navigate('Today')
      },
    },
    {
      title: 'История',
      description: 'Все записи о приемах лекарств',
      icon: '📋',
      count: 0,
      onPress: () => {
        navigation.navigate('History')
      },
    },
    {
      title: 'Напоминания',
      description: 'Настройка напоминаний о приеме',
      icon: '⏰',
      count: 0,
      onPress: () => {
        navigation.navigate('Reminders')
      },
    },
    {
      title: 'Статистика',
      description: 'Анализ приема лекарств',
      icon: '📊',
      count: 0,
      onPress: () => {
        navigation.navigate('Statistics')
      },
    }
  ]

  const quickActions = [
    {
      title: 'Быстрый прием',
      description: 'Отметить прием лекарства',
      icon: '💊',
      color: colors.primary,
      onPress: () => {
        navigation.navigate('QuickIntake')
      },
    },
    {
      title: 'Добавить напоминание',
      description: 'Создать новое напоминание',
      icon: '➕',
      color: colors.secondary,
      onPress: () => {
        navigation.navigate('AddReminder')
      },
    },
  ]

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Прием</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Управление приемом лекарств
          </Text>
        </View>

        {/* Быстрые действия */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Быстрые действия</Text>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                onPress={action.onPress}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Основные разделы */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Разделы</Text>

          {intakeItems.map((item, index) => (
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
                <View style={styles.menuRight}>
                  {item.count > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{item.count}</Text>
                    </View>
                  )}
                  <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Информация */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О приеме лекарств</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Отмечайте прием лекарств для отслеживания{'\n'}
            • Настройте напоминания о приеме{'\n'}
            • Анализируйте статистику приема{'\n'}
            • Ведите историю для врача
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  quickActionDescription: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    opacity: 0.9,
    textAlign: 'center',
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
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  menuDescription: {
    fontSize: FONT_SIZE.sm,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    minWidth: 20,
    height: SPACING.md,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  badgeText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: SPACING.md,
  },
})
