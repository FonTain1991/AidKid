# Обход верификации Google для разработки

## 🚀 Быстрое решение

### 1. Добавить тестовых пользователей

1. Зайдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект `aidkit-dcfe7`
3. Перейдите в **APIs & Services** → **OAuth consent screen**
4. В разделе **Test users** нажмите **+ ADD USERS**
5. Добавьте email адреса, которые будут тестировать приложение:
   - `eupoplavsky@gmail.com` (ваш email)
   - Email других тестировщиков
6. Нажмите **SAVE**

### 2. Настроить OAuth consent screen

1. В том же разделе **OAuth consent screen**
2. Убедитесь, что:
   - **User Type**: External
   - **Publishing status**: Testing
   - **Test users**: Добавлены ваши email адреса

### 3. Обновить OAuth клиенты

1. Перейдите в **APIs & Services** → **Credentials**
2. Найдите ваш **OAuth 2.0 Client ID**
3. Убедитесь, что в **Authorized redirect URIs** есть:
   - `com.aidkit:/oauth2redirect`

### 4. Включить Google Drive API

1. Перейдите в **APIs & Services** → **Library**
2. Найдите **Google Drive API**
3. Нажмите **Enable**

## 🔧 Альтернативное решение: Использовать appDataFolder

Если не хотите проходить верификацию, можно использовать ограниченный доступ:

```typescript
// В googleDrive.ts изменить scope на:
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
```

**Преимущества appDataFolder:**
- ✅ Не требует верификации
- ✅ Безопасно - только ваше приложение
- ✅ Достаточно для семейных групп
- ✅ Работает сразу

## 🎯 Рекомендуемый подход

**Для разработки и тестирования:**
1. Добавьте тестовых пользователей
2. Используйте `drive.appdata` scope
3. Опубликуйте приложение только после верификации

**Для продакшена:**
1. Пройдите верификацию Google
2. Используйте полный `drive` scope
3. Опубликуйте в Google Play Store

## 📱 Что делать сейчас

1. **Добавьте тестовых пользователей** в Google Cloud Console
2. **Переавторизуйтесь** в приложении
3. **Попробуйте создать семейную группу**

## ⚠️ Важно

- Тестовые пользователи могут использовать приложение без предупреждений
- Остальные пользователи будут видеть предупреждение
- Для публичного релиза нужна верификация
