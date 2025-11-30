import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '@/providers/theme'
import { SafeAreaView } from '@/components/Layout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingScreenProps {
  onComplete: () => void
}

const slides = [
  {
    icon: 'heart',
    iconColor: '#FF6B6B',
    title: 'Добро пожаловать в AidKit',
    description: 'Ваш персональный помощник для управления домашней аптечкой и контроля приема лекарств'
  },
  {
    icon: 'package',
    iconColor: '#4ECDC4',
    title: 'Организуйте аптечку',
    description: 'Создавайте аптечки для дома, дачи, автомобиля. Добавляйте лекарства с фото, сроком годности и количеством'
  },
  {
    icon: 'bell',
    iconColor: '#FFD93D',
    title: 'Умные напоминания',
    description: 'Настраивайте напоминания о приеме лекарств для всей семьи. Отслеживайте историю приема'
  },
  {
    icon: 'calendar',
    iconColor: '#95E1D3',
    title: 'Контроль сроков',
    description: 'Получайте уведомления о заканчивающихся лекарствах и истекающих сроках годности'
  },
  {
    icon: 'shopping-cart',
    iconColor: '#F38181',
    title: 'Список покупок',
    description: 'Создавайте списки необходимых лекарств с напоминаниями о походе в аптеку'
  },
  {
    icon: 'bar-chart-2',
    iconColor: '#A8E6CF',
    title: 'Статистика и аналитика',
    description: 'Отслеживайте прием лекарств, просматривайте историю и статистику для всей семьи'
  }
]

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)
    setCurrentIndex(index)
  }

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentIndex + 1),
        animated: true
      })
    } else {
      handleComplete()
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentIndex - 1),
        animated: true
      })
    }
  }

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true')
      onComplete()
    } catch (error) {
      console.error('Failed to save onboarding status:', error)
      onComplete()
    }
  }

  const isLastSlide = currentIndex === slides.length - 1

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Пропустить
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={[styles.slide, { width: SCREEN_WIDTH }]}
          >
            <View style={styles.slideContent}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${slide.iconColor}15` }
                ]}
              >
                <Icon
                  name={slide.icon}
                  size={80}
                  color={slide.iconColor}
                />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {slide.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  currentIndex === index
                    ? colors.primary
                    : colors.border,
                width: currentIndex === index ? 24 : 8
              }
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigation}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              { backgroundColor: colors.card }
            ]}
            onPress={goToPrevious}
          >
            <Icon name='arrow-left' size={20} color={colors.text} />
            <Text style={[styles.navButtonText, { color: colors.text }]}>
              Назад
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: colors.primary },
            currentIndex === 0 && styles.fullWidthButton
          ]}
          onPress={goToNext}
        >
          <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
            {isLastSlide ? 'Начать' : 'Далее'}
          </Text>
          <Icon name='arrow-right' size={20} color='#FFFFFF' />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 500
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s'
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  backButton: {
    flex: 0.4
  },
  nextButton: {
    flex: 1
  },
  fullWidthButton: {
    flex: 1
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600'
  }
})

