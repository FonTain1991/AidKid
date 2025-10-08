// Типы навигации
export type RootStackParamList = {
  Splash: undefined
  BottomTabs: undefined
  Kit: {
    kitId?: string;
    mode: 'create' | 'edit';
  }
  KitDetails: {
    kitId: string;
  }
  Medicine: {
    medicineId?: string;
    mode: 'create' | 'edit';
    kitId?: string;
  }
  NotificationSettings: undefined
  QuickIntake: undefined
  AddReminder: undefined
  Reminders: undefined
}