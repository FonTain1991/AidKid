import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '@/app/providers/theme'
import { databaseService } from '@/shared/lib'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import type { Medicine } from '@/entities/medicine/model/types'
import { TextInput } from '../TextInput'

interface MedicineAutoCompleteProps {
  value: string
  onChangeText: (text: string) => void
  onSelectMedicine?: (medicine: Medicine) => void
  placeholder?: string
  label?: string
  style?: any
}

export function MedicineAutoComplete({
  value,
  onChangeText,
  onSelectMedicine,
  placeholder = 'Введите название лекарства',
  label,
  style
}: MedicineAutoCompleteProps) {
  const { colors } = useTheme()
  const [suggestions, setSuggestions] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<TextInput>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const fadeAnim = useRef(new Animated.Value(0)).current

  const searchMedicines = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setLoading(true)
      await databaseService.init()
      const allMedicines = await databaseService.getMedicines()

      const filtered = allMedicines.filter(medicine => medicine.name.toLowerCase().includes(query.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(query.toLowerCase())).slice(0, 5) // Ограничиваем до 5 результатов

      setSuggestions(filtered)
      if (filtered.length > 0) {
        setShowSuggestions(true)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      } else {
        setShowSuggestions(false)
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start()
      }
      setSelectedIndex(-1)
    } catch (err) {
      console.error('Failed to search medicines:', err)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTextChange = (text: string) => {
    onChangeText(text)

    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Устанавливаем новый таймаут для поиска
    timeoutRef.current = setTimeout(() => {
      searchMedicines(text)
    }, 300)
  }

  const handleSelectMedicine = (medicine: Medicine) => {
    onChangeText(medicine.name)
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestions(false)
    })
    setSelectedIndex(-1)
    onSelectMedicine?.(medicine)
  }

  const handleKeyPress = (e: any) => {
    if (!showSuggestions || suggestions.length === 0) {
      return
    }

    switch (e.nativeEvent.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectMedicine(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      default:
        break
    }
  }

  const handleBlur = () => {
    // Небольшая задержка, чтобы дать время на клик по предложению
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowSuggestions(false)
      })
      setSelectedIndex(-1)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const renderSuggestion = ({ item, index }: { item: Medicine; index: number }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        {
          backgroundColor: index === selectedIndex ? colors.primary + '20' : colors.card,
          borderColor: colors.border
        }
      ]}
      onPress={() => handleSelectMedicine(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionName, { color: colors.text }]}>
          {item.name}
        </Text>
        {item.manufacturer && (
          <Text style={[styles.suggestionManufacturer, { color: colors.textSecondary }]}>
            {item.manufacturer}
          </Text>
        )}
        <Text style={[styles.suggestionForm, { color: colors.textSecondary }]}>
          {item.form}
        </Text>
      </View>
      <Icon name='arrow-up-left' size={16} color={colors.primary} />
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={placeholder}
        value={value}
        onChangeText={handleTextChange}
        onKeyPress={handleKeyPress}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim
            }
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000
  },
  searchIconContainer: {
    position: 'absolute',
    right: 16,
    top: 16
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    maxHeight: 200
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    minHeight: 60
  },
  suggestionContent: {
    flex: 1
  },
  suggestionName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20
  },
  suggestionManufacturer: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
    opacity: 0.8
  },
  suggestionForm: {
    fontSize: FONT_SIZE.xs,
    opacity: 0.6,
    fontWeight: '500'
  }
})
