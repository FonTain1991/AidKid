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
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/providers/theme'
import { SafeAreaView } from '@/components/Layout'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingScreenProps {
  onComplete: () => void
}

const getSlides = (t: (key: string) => string) => [
  {
    icon: 'heart' as const,
    iconColor: '#FF6B6B',
    title: t('onboarding.welcome'),
    description: t('onboarding.welcomeDesc'),
  },
  {
    icon: 'package' as const,
    iconColor: '#4ECDC4',
    title: t('onboarding.organizeKit'),
    description: t('onboarding.organizeKitDesc'),
  },
  {
    icon: 'bell' as const,
    iconColor: '#FFD93D',
    title: t('onboarding.smartReminders'),
    description: t('onboarding.smartRemindersDesc'),
  },
  {
    icon: 'calendar' as const,
    iconColor: '#95E1D3',
    title: t('onboarding.expiryControl'),
    description: t('onboarding.expiryControlDesc'),
  },
  {
    icon: 'shopping-cart' as const,
    iconColor: '#F38181',
    title: t('onboarding.shoppingList'),
    description: t('onboarding.shoppingListDesc'),
  },
  {
    icon: 'bar-chart-2' as const,
    iconColor: '#A8E6CF',
    title: t('onboarding.statistics'),
    description: t('onboarding.statisticsDesc'),
  },
]

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const slides = getSlides(t)
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
            {t('common.skip')}
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
              {t('common.back')}
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
            {isLastSlide ? t('common.start') : t('common.next')}
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

