import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native'
import { Camera, CameraType } from 'react-native-camera-kit'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function BarcodeScannerScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [hasPermission, setHasPermission] = useState(false)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      })

      if (!permission) {
        setHasPermission(false)
        return
      }

      const result = await check(permission)

      if (result === RESULTS.GRANTED) {
        setHasPermission(true)
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission)
        setHasPermission(requestResult === RESULTS.GRANTED)
      } else {
        // Permission blocked or unavailable
        Alert.alert(
          'Нет доступа к камере',
          'Для сканирования штрих-кодов необходим доступ к камере. Пожалуйста, разрешите доступ в настройках приложения.',
          [
            { text: 'Отмена', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Открыть настройки', onPress: () => Linking.openSettings() }
          ]
        )
      }
    } catch (error) {
      console.error('Ошибка проверки разрешений:', error)
      setHasPermission(false)
    }
  }

  const handleBarCodeRead = async (event: any) => {
    if (!isScanning) return

    const barcode = event.nativeEvent.codeStringValue
    if (!barcode) return

    setIsScanning(false)
    console.log('Отсканирован штрих-код:', barcode)

    try {
      await databaseService.init()
      const medicine = await databaseService.getMedicineByBarcode(barcode)

      if (medicine) {
        // Лекарство найдено - открываем его
        Alert.alert(
          'Лекарство найдено!',
          `${medicine.name}`,
          [
            {
              text: 'Открыть',
              onPress: () => {
                navigation.replace('Medicine', { medicineId: medicine.id, mode: 'edit' })
              }
            },
            {
              text: 'Сканировать еще',
              onPress: () => setIsScanning(true)
            }
          ]
        )
      } else {
        // Лекарство не найдено - предлагаем вернуться или продолжить
        const canGoBack = navigation.canGoBack()

        Alert.alert(
          'Лекарство не найдено',
          `Штрих-код ${barcode} не найден в вашей аптечке.${canGoBack ? ' Хотите использовать этот штрих-код для текущего лекарства?' : ''}`,
          [
            ...(canGoBack ? [{
              text: 'Использовать',
              onPress: () => {
                // Возвращаемся назад с штрих-кодом
                navigation.navigate({
                  name: navigation.getState().routes[navigation.getState().routes.length - 2]?.name as any,
                  params: { scannedBarcode: barcode },
                  merge: true
                } as any)
              }
            }] : []),
            {
              text: 'Сканировать еще',
              onPress: () => setIsScanning(true)
            },
            {
              text: 'Закрыть',
              onPress: () => navigation.goBack()
            }
          ]
        )
      }
    } catch (error) {
      console.error('Ошибка при поиске лекарства:', error)
      Alert.alert(
        'Ошибка',
        'Не удалось найти лекарство',
        [
          { text: 'Попробовать снова', onPress: () => setIsScanning(true) }
        ]
      )
    }
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Нет доступа к камере
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Разрешите доступ к камере в настройках
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.buttonText}>Открыть настройки</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.border, marginTop: SPACING.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Назад</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        cameraType={CameraType.Back}
        scanBarcode={true}
        onReadCode={handleBarCodeRead}
        showFrame={false}
        laserColor='transparent'
        frameColor='transparent'
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.instruction, { color: 'white' }]}>
            Наведите камеру на штрих-код
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  footer: {
    paddingBottom: SPACING.xxl * 2,
    alignItems: 'center',
  },
  instruction: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
})
