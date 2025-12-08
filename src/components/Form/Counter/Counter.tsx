import { Text } from '@/components/Text'
import { memo, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useStyles } from './useStyles'
import { Row } from '@/components/Layout'

interface CounterProps {
  value: number
  onChange: (value: number) => void
  label: string
}
export const Counter = memo(({ value, onChange, label }: CounterProps) => {
  const [localValue, setLocalValue] = useState(1)
  const styles = useStyles()

  const handleDecrement = () => {
    setLocalValue(Math.max(1, localValue - 1))
    onChange?.(localValue - 1)
  }

  const handleIncrement = () => {
    setLocalValue(Math.min(10, localValue + 1))
    onChange?.(localValue + 1)
  }

  useEffect(() => {
    setLocalValue(value || 1)
  }, [value])

  return (
    <View style={styles.quantityContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Row>
        <Pressable
          style={({ pressed }) => [styles.quantityButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleDecrement}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </Pressable>

        <View style={styles.quantityDisplay}>
          <Text style={styles.quantityText}>{localValue}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.quantityButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleIncrement}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </Row>
    </View>
  )
})