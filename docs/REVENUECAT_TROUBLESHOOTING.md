# 🔧 Решение ошибки: "There are no products registered in the RevenueCat dashboard"

## ❌ Ошибка

```
Error fetching offerings - PurchasesError(code=ConfigurationError, 
underlyingErrorMessage=There are no products registered in the RevenueCat dashboard 
for your offerings.)
```

## ✅ Решение

Эта ошибка означает, что Products не привязаны к Offering или не синхронизированы из Google Play.

### Шаг 1: Проверьте Products в RevenueCat

1. Перейдите в **Products** (левое меню)
2. Проверьте, видны ли `premium_monthly` и `premium_yearly`

**Если Products НЕ видны:**

#### Вариант A: Подождите синхронизации
- Google Play синхронизируется с RevenueCat до 5-10 минут
- Подождите и обновите страницу

#### Вариант B: Добавьте Products вручную
1. Нажмите **"Add Product"**
2. Выберите Android приложение
3. Введите Product ID: `premium_monthly`
4. Нажмите **"Save"**
5. Повторите для `premium_yearly`

### Шаг 2: Привяжите Products к Entitlement

1. Откройте каждый Product (`premium_monthly`)
2. В разделе **"Attach to Entitlements"**
3. Выберите `premium`
4. Нажмите **"Save"**
5. Повторите для `premium_yearly`

### Шаг 3: Проверьте Offering

1. Перейдите в **Offerings** → `default`
2. Убедитесь, что добавлены Packages:
   - Package с Product `premium_monthly`
   - Package с Product `premium_yearly`
3. Если Packages пустые, добавьте их:
   - Нажмите **"Add Package"**
   - Identifier: `$rc_monthly`
   - Product: выберите `premium_monthly`
   - Повторите для `premium_yearly`

### Шаг 4: Проверьте настройки приложения

Убедитесь, что:
- Package Name в RevenueCat = `com.aidkit`
- Package Name совпадает с `applicationId` в `build.gradle`

### Шаг 5: Проверьте Google Play Console

1. Подписки `premium_monthly` и `premium_yearly` **активированы**
2. Основные планы подписок **опубликованы**
3. Прошло минимум 2-3 минуты после активации

## 🔍 Быстрая диагностика

Проверьте чек-лист:

- [ ] Products `premium_monthly` и `premium_yearly` видны в RevenueCat
- [ ] Products привязаны к entitlement `premium`
- [ ] Offering `default` содержит Packages с Products
- [ ] Package Name в RevenueCat = `com.aidkit`
- [ ] Подписки активированы в Google Play Console
- [ ] Прошло минимум 5 минут после настройки

## 💡 Альтернативное решение: Проверка через API

Если проблема не решается, проверьте через RevenueCat Dashboard:
1. **Charts** → **Products** - должны быть видны ваши продукты
2. **Customers** → выберите тестового пользователя - проверьте, видит ли он продукты

---

**После исправления**: Перезапустите приложение и проверьте снова!

