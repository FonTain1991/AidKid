import { FONT_SIZE } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { TextInput } from '../TextInput'

interface Option {
  label: string
  value: string | number
  subTitle?: string
}

interface AutoCompleteProps {
  options: Option[]
  value: string
  onChangeText: (text: string) => void
  onSelectMedicine?: (item: Option) => void
  label?: string
  style?: any
}

export function AutoComplete<T>(props: AutoCompleteProps) {
  const { options, value, onChangeText, onSelectMedicine, label } = props

  const { colors } = useTheme()
  const [suggestions, setSuggestions] = useState<Option[]>([])

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const timeoutRef = useRef()
  const fadeAnim = useRef(new Animated.Value(0)).current

  const searchMedicines = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const filtered = options.filter(item => item.label.toLowerCase().includes(query.toLowerCase()) ||
        String(item.value)?.toLowerCase()?.includes(query.toLowerCase())).slice(0, 5)

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
      console.error('Failed to search options:', err)
      setSuggestions([])
      setShowSuggestions(false)
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

  const handleSelectMedicine = (item: Option) => {
    onChangeText(item.label)
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestions(false)
    })
    setSelectedIndex(-1)
    onSelectMedicine?.(item)
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

  const renderSuggestion = ({ item, index }: { item: Option; index: number }) => (
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
          {item.label}
        </Text>
        {item.subTitle && (
          <Text style={[styles.suggestionManufacturer, { color: colors.muted }]}>
            {item.subTitle}
          </Text>
        )}
      </View>
      <Icon name='arrow-up-left' size={16} color={colors.primary} />
    </TouchableOpacity>
  )

  return (
    <>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleTextChange}
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
    </>
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
