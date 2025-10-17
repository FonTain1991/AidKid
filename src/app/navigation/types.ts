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
    scannedBarcode?: string;
    initialName?: string;
    initialDescription?: string;
  }
  AddMedicine: {
    kitId?: string;
    initialName?: string;
    initialDescription?: string;
  }
  NotificationSettings: undefined
  QuickIntake: undefined
  AddReminder: undefined
  Reminders: undefined
  Today: undefined
  History: undefined
  Statistics: undefined
  ExpiringMedicines: undefined
  LowStockMedicines: undefined
  FamilyMembers: undefined
  BarcodeScanner: undefined
  ShoppingList: undefined
  AddShoppingItem: undefined
}