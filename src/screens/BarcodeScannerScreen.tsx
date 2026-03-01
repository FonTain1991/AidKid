import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useMyNavigation } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { medicineModel } from '@/services/models'
import { CommonActions } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Camera, CameraType } from 'react-native-camera-kit'
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions'

export function BarcodeScannerScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const navigation = useMyNavigation()
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
          t('barcode.noCameraAccess'),
          t('barcode.noCameraAccessDesc'),
          [
            { text: t('common.cancel'), style: 'cancel', onPress: () => navigation.goBack() },
            { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          ]
        )
      }
    } catch (error) {
      console.error('Ошибка проверки разрешений:', error)
      setHasPermission(false)
    }
  }

  const handleBarCodeRead = async (event: any) => {
    if (!isScanning) {
      return
    }

    const barcode = event.nativeEvent.codeStringValue
    if (!barcode) {
      return
    }

    setIsScanning(false)
    try {
      const medicine = await medicineModel.getByBarcode(barcode)

      if (medicine) {
        // Лекарство найдено - открываем его
        Alert.alert(
          t('medicine.medicineFound'),
          `${medicine.name}`,
          [
            {
              text: t('common.open'),
              onPress: () => {
                navigation.navigate('medicine', { medicineId: Number(medicine.id) })
              },
            },
            {
              text: t('common.scanAgain'),
              onPress: () => setIsScanning(true),
            },
          ]
        )
      } else {
        // Лекарство не найдено - возвращаемся с штрих-кодом если есть предыдущий экран
        const state = navigation.getState()
        const { routes } = state
        const previousRoute = routes[routes.length - 2]

        // Если предыдущий экран - Medicine (форма лекарства), возвращаемся с штрих-кодом
        if (previousRoute && previousRoute.name === 'medicine') {
          // Используем dispatch с pop и обновлением параметров предыдущего экрана
          navigation.dispatch(state => {
            const routes = state.routes.slice(0, -1) // Удаляем текущий экран (BarcodeScanner)
            const updatedRoutes = routes.map((route, index) => {
              if (index === routes.length - 1 && route.name === 'medicine') {
                return {
                  ...route,
                  params: { ...(route.params as any), scannedBarcode: barcode }
                }
              }
              return route
            })

            return CommonActions.reset({
              ...state,
              routes: updatedRoutes,
              index: updatedRoutes.length - 1
            })
          })
        } else {
          // Если открыли с главной - показываем что не найдено
          Alert.alert(
            t('medicine.medicineNotFound'),
            t('medicine.barcodeNotFound', { barcode }),
            [
              {
                text: t('common.scanAgain'),
                onPress: () => setIsScanning(true),
              },
              {
                text: t('common.close'),
                onPress: () => navigation.goBack(),
              },
            ]
          )
        }
      }
    } catch (error) {
      console.error('Ошибка при поиске лекарства:', error)
      Alert.alert(
        t('support.error'),
        t('medicine.failedToFindMedicine'),
        [
          { text: t('common.tryAgain'), onPress: () => setIsScanning(true) },
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
            {t('barcode.noCameraAccess')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.secondary }]}>
            {t('barcode.noCameraAccessDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.buttonText}>{t('common.openSettings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.border, marginTop: SPACING.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.back')}</Text>
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
            {t('barcode.pointCamera')}
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
