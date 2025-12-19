import { memo } from 'react'
import { View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './hooks'

export const Features = memo(({ title }: { title: string }) => {
  const styles = useStyles()
  return (
    <View style={styles.featuresContainer}>
      <Text style={styles.featuresTitle}>{title}</Text>
      <View style={styles.featuresGrid}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Неограниченные аптечки</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Неограниченные лекарства</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Облачное резервное копирование</Text>
        </View>
        {/* <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Семейный доступ</Text>
        </View> */}
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Расширенная статистика</Text>
        </View>
        {/* <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✓</Text>
          <Text style={styles.featureText}>Экспорт данных</Text>
        </View> */}
      </View>
    </View>
  )
})