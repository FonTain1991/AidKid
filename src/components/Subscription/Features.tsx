import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './hooks'

export const Features = memo(({ title }: { title: string }) => {
  const styles = useStyles()
  const { t } = useTranslation()
  return (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>{title}</Text>
      <View style={styles.featuresGrid}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>{t('subscribe.unlimitedKitsFeature')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>{t('subscribe.unlimitedMedicinesFeature')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>{t('subscribe.cloudBackupFeature')}</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>{t('subscribe.extendedStatsFeature')}</Text>
        </View>
        {/* <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Экспорт данных</Text>
        </View> */}
      </View>
    </View>
  )
})