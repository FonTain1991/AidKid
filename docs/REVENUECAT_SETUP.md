# 💳 Настройка RevenueCat для подписок

## ✅ Выбор версии API: Используйте v2

При настройке RevenueCat Dashboard **выберите API версию v2**:
- ✅ Более современная и функциональная
- ✅ Лучшая поддержка Google Play Billing Library 6
- ✅ Улучшенная аналитика и производительность
- ✅ API v1 устарел и не рекомендуется

**Где выбрать версию**: В настройках проекта RevenueCat автоматически использует v2 для новых проектов.

## ✅ Одобрение Google Play

**RevenueCat полностью одобрен Google Play Market** при соблюдении всех требований.

### Важные требования:

1. **Версия библиотеки**: Используйте `react-native-purchases` версии 7.0.0 или выше
   - Версии 7+ поддерживают Google Play Billing Library 6
   - Это обязательное требование Google Play с 2024 года

2. **Соблюдение политики Google Play**:
   - Прозрачность цен и условий
   - Возможность отмены подписки в приложении
   - Четкое описание функций подписки
   - Отсутствие обманных практик

3. **Правильная настройка**:
   - Корректная конфигурация в Google Play Console
   - Правильная обработка покупок в коде
   - Тестирование с тестовыми аккаунтами

## 🚀 Быстрый старт

### Шаг 1: Установка

```bash
yarn add react-native-purchases
# или
npm install react-native-purchases
```

Для iOS (если используете):
```bash
cd ios && pod install && cd ..
```

### Шаг 2: Регистрация в RevenueCat

1. Зайдите на [https://app.revenuecat.com/](https://app.revenuecat.com/)
2. Создайте бесплатный аккаунт
3. Создайте новый проект:
   - Название: `AidKit`
4. Добавьте приложение:
   - **Android**: Package Name `com.aidkit`
   - **iOS**: Bundle ID (если планируется iOS версия)

**Важно**: При создании проекта автоматически используется API v2. Не меняйте версию на v1.

### Шаг 2.1: Получение API ключей

1. В Dashboard перейдите в **Project Settings** → **API Keys**
2. Найдите раздел **"Public SDK Keys"** (НЕ Secret Keys!)
3. Скопируйте ключи:
   - **Android Public SDK Key** (начинается с `goog_`)
   - **iOS Public SDK Key** (если есть, начинается с `appl_`)

⚠️ **Используйте Public SDK Keys**, а не Secret API Keys! Secret Keys нужны только для серверной части.

### Шаг 3: Настройка Google Play

1. В Google Play Console создайте подписки:
   - Перейдите в **Монетизация** → **Продукты** → **Подписки**
   - Создайте подписку с ID: `premium_monthly`
   - Создайте подписку с ID: `premium_yearly`

2. Настройте цены:
   - `premium_monthly`: 99₽/месяц
   - `premium_yearly`: 699₽/год

3. Добавьте описания подписок на русском языке

4. Настройте бесплатную пробную версию (опционально):
   - 7 дней бесплатного пробного периода

### Шаг 4: Интеграция в приложение

#### Создание сервиса подписки

```typescript
// src/shared/lib/subscription.ts
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering,
  PurchasesPackage 
} from 'react-native-purchases'

// API ключ из RevenueCat Dashboard
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key'
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key'

class SubscriptionService {
  private isInitialized = false

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return

    try {
      const apiKey = Platform.OS === 'android' 
        ? REVENUECAT_API_KEY_ANDROID 
        : REVENUECAT_API_KEY_IOS

      await Purchases.configure({ apiKey })

      if (userId) {
        await Purchases.logIn(userId)
      }

      this.isInitialized = true
      console.log('RevenueCat initialized successfully')
    } catch (error) {
      console.error('Error initializing RevenueCat:', error)
      throw error
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo()
    } catch (error) {
      console.error('Error getting customer info:', error)
      throw error
    }
  }

  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo()
      return customerInfo.entitlements.active['premium'] !== undefined
    } catch (error) {
      console.error('Error checking premium status:', error)
      return false
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings()
      return offerings.current
    } catch (error) {
      console.error('Error getting offerings:', error)
      return null
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      return customerInfo
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase')
      } else {
        console.error('Error purchasing package:', error)
      }
      throw error
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      return await Purchases.restorePurchases()
    } catch (error) {
      console.error('Error restoring purchases:', error)
      throw error
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut()
      this.isInitialized = false
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }
}

export const subscriptionService = new SubscriptionService()
```

#### Использование в компонентах

```typescript
// src/screens/Subscription/SubscriptionScreen.tsx
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { Button } from '@/shared/ui'
import { 
  subscriptionService,
  type PurchasesOffering,
  type PurchasesPackage 
} from '@/shared/lib/subscription'

export const SubscriptionScreen = () => {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOfferings()
  }, [])

  const loadOfferings = async () => {
    try {
      const currentOfferings = await subscriptionService.getOfferings()
      setOfferings(currentOfferings)
    } catch (error) {
      console.error('Error loading offerings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setLoading(true)
      await subscriptionService.purchasePackage(pkg)
      // Показать успешное сообщение
      // Навигация обратно
    } catch (error: any) {
      if (!error.userCancelled) {
        // Показать ошибку
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    try {
      setLoading(true)
      await subscriptionService.restorePurchases()
      // Показать успешное сообщение
    } catch (error) {
      // Показать ошибку
    } finally {
      setLoading(false)
    }
  }

  if (loading && !offerings) {
    return <Text>Загрузка...</Text>
  }

  return (
    <View>
      {offerings?.availablePackages.map((pkg) => (
        <View key={pkg.identifier}>
          <Text>{pkg.storeProduct.title}</Text>
          <Text>{pkg.storeProduct.priceString}</Text>
          <Button
            title="Купить"
            onPress={() => handlePurchase(pkg)}
            disabled={loading}
          />
        </View>
      ))}
      
      <Button
        title="Восстановить покупки"
        onPress={handleRestore}
        disabled={loading}
      />
    </View>
  )
}
```

#### Проверка подписки перед доступом к функциям

```typescript
// Пример использования в любой функции
import { subscriptionService } from '@/shared/lib/subscription'

const createKit = async () => {
  const isPremium = await subscriptionService.isPremium()
  
  if (!isPremium) {
    // Проверить лимиты бесплатной версии
    const kitsCount = await getKitsCount()
    if (kitsCount >= 1) {
      // Показать paywall
      navigation.navigate('Subscription')
      return
    }
  }

  // Создать аптечку
  await kitService.createKit(data)
}
```

## 🔧 Настройка в RevenueCat Dashboard

### 1. Создание Entitlements

1. Перейдите в **Project Settings** → **Entitlements**
2. Создайте entitlement: `premium`
3. Привяжите к нему продукты из Google Play:
   - `premium_monthly`
   - `premium_yearly`

### 2. Настройка Offerings

1. Перейдите в **Offerings**
2. Создайте Offering: `default`
3. Добавьте в него packages:
   - Monthly package → `premium_monthly`
   - Annual package → `premium_yearly`

### 3. Настройка Attribution

1. Подключите аналитику (опционально):
   - Google Analytics
   - Firebase Analytics
   - Amplitude

## ✅ Тестирование

### Тестовые аккаунты Google Play

1. В Google Play Console добавьте тестовые аккаунты:
   - **Тестирование** → **Тестовые аккаунты**
   - Добавьте email вашего тестового аккаунта

2. На тестовом устройстве:
   - Войдите в Google Play с тестовым аккаунтом
   - Установите приложение
   - Тестовые покупки не будут списывать деньги

### Проверка покупок

```typescript
// Проверка статуса подписки
const checkStatus = async () => {
  const isPremium = await subscriptionService.isPremium()
  console.log('Is Premium:', isPremium)
  
  const customerInfo = await subscriptionService.getCustomerInfo()
  console.log('Customer Info:', JSON.stringify(customerInfo, null, 2))
}
```

## 📋 Чек-лист перед публикацией

- [ ] Установлена актуальная версия `react-native-purchases` (7+)
- [ ] Настроены подписки в Google Play Console
- [ ] Настроены Entitlements в RevenueCat
- [ ] Настроены Offerings в RevenueCat
- [ ] Протестированы покупки на тестовых аккаунтах
- [ ] Протестировано восстановление покупок
- [ ] Проверена обработка ошибок
- [ ] Добавлена кнопка отмены подписки (требование Google Play)
- [ ] Подготовлены описания подписок на русском языке
- [ ] Проверена работа на разных версиях Android

## 🚨 Важные замечания

### Google Play требования:

1. **Прозрачность**:
   - Цена должна быть видна до покупки
   - Условия подписки должны быть понятны
   - Автоматическое продление должно быть указано

2. **Отмена подписки**:
   - Пользователь должен иметь возможность отменить подписку
   - Лучше всего добавить кнопку в приложении
   - Можно отменить через Google Play → Подписки

3. **Возврат средств**:
   - Пользователь может вернуть деньги в течение 48 часов
   - Обработайте это в коде корректно

4. **Пробный период**:
   - Если используете trial, четко укажите это
   - Пользователь должен понимать, когда начнется плата

## 📚 Дополнительные ресурсы

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [Google Play Subscription Policy](https://play.google.com/about/monetization-ads/subscription-policy/)
- [React Native Purchases GitHub](https://github.com/RevenueCat/react-native-purchases)

## 💡 Альтернативы

Если по каким-то причинам RevenueCat не подходит, можно использовать:
- `react-native-iap` - обертка над нативными библиотеками
- Прямая интеграция Google Play Billing Library (Android)
- Прямая интеграция StoreKit (iOS)

Но RevenueCat рекомендуется, так как:
- Проще в использовании
- Единый код для обеих платформ
- Встроенная аналитика
- Автоматическое восстановление покупок

