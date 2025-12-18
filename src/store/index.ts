import { FamilyMember, Medicine, MedicineKit, Reminder, ReminderMedicine, ShoppingList } from '@/services/models'
import { create } from 'zustand'

interface AppStore {
  // Medicine Kits
  medicineKits: MedicineKit[]
  setMedicineKits: (medicineKits: MedicineKit[]) => void
  addMedicineKit: (medicineKit: MedicineKit) => void
  updateMedicineKit: (medicineKit: MedicineKit) => void
  deleteMedicineKit: (id: number) => void
  // Family Members
  familyMembers: FamilyMember[]
  setFamilyMembers: (familyMembers: FamilyMember[]) => void
  addFamilyMember: (familyMember: FamilyMember) => void
  updateFamilyMember: (familyMember: FamilyMember) => void
  deleteFamilyMember: (id: number) => void
  // Medicines
  medicines: Medicine[]
  setMedicines: (medicines: Medicine[]) => void
  addMedicine: (medicine: Medicine) => void
  updateMedicine: (medicine: Medicine) => void
  deleteMedicine: (id: number) => void
  // Quick Intake
  quickIntakeMedicines: { medicineId: number, dosage: string }[]
  setQuickIntakeMedicines: (quickIntakeMedicines: { medicineId: number, dosage: string }[]) => void
  isClearedQuickIntakeMedicines: boolean
  setIsClearedQuickIntakeMedicines: (isClearedQuickIntakeMedicines: boolean) => void
  // Reminders
  reminders: Reminder[]
  setReminders: (reminders: Reminder[]) => void
  addReminder: (reminder: Reminder) => void
  updateReminder: (reminder: Reminder) => void
  deleteReminder: (id: number) => void
  // Reminder Medicines
  reminderMedicines: ReminderMedicine[]
  setReminderMedicines: (reminderMedicines: ReminderMedicine[]) => void
  addReminderMedicine: (reminderMedicine: ReminderMedicine) => void
  updateReminderMedicine: (reminderMedicine: ReminderMedicine) => void
  deleteReminderMedicine: (id: number) => void
  // Shopping List
  shoppingList: ShoppingList[]
  setShoppingList: (shoppingList: ShoppingList[]) => void
  addShoppingList: (shoppingList: ShoppingList) => void
  updateShoppingList: (shoppingList: ShoppingList) => void
  deleteShoppingList: (id: number) => void
  // Google Drive
  googleDrive: {
    isSignedIn: boolean
    setIsSignedIn: (isSignedIn: boolean) => void
    isRefetching: boolean
    setIsRefetching: (isRefetching: boolean) => void
  }
  // Local Backups
  localBackups: {
    isRefetching: boolean
    setIsRefetching: (isRefetching: boolean) => void
  }
}

export const useAppStore = create<AppStore>()(set => ({
  // Medicine Kits
  medicineKits: [],
  setMedicineKits: medicineKits => set(({ medicineKits })),
  addMedicineKit: medicineKit => set(({ medicineKits }) => ({ medicineKits: [...medicineKits, medicineKit] })),
  updateMedicineKit: (data: MedicineKit) => set(({ medicineKits }) => ({
    medicineKits: medicineKits.map(kit => (kit.id === data.id ? data : kit))
  })),
  deleteMedicineKit: id => set(({ medicineKits }) => ({
    medicineKits: medicineKits.filter(kit => kit.id !== id)
  })),

  // Family Members
  familyMembers: [],
  setFamilyMembers: familyMembers => set(({ familyMembers })),
  addFamilyMember: familyMember => set(({ familyMembers }) => ({ familyMembers: [...familyMembers, familyMember] })),
  updateFamilyMember: (data: FamilyMember) => set(({ familyMembers }) => ({
    familyMembers: familyMembers.map(member => (member.id === data.id ? data : member))
  })),
  deleteFamilyMember: id => set(({ familyMembers }) => ({
    familyMembers: familyMembers.filter(member => member.id !== id)
  })),

  // Medicines
  medicines: [],
  setMedicines: medicines => set(({ medicines })),
  addMedicine: medicine => set(({ medicines }) => ({ medicines: [...medicines, medicine] })),
  updateMedicine: (data: Medicine) => set(({ medicines }) => ({
    medicines: medicines.map(medicine => (medicine.id === data.id ? data : medicine))
  })),
  deleteMedicine: (id: number) => set(({ medicines }) => ({
    medicines: medicines.filter(medicine => medicine.id !== id)
  })),
  // Quick Intake
  quickIntakeMedicines: [],
  setQuickIntakeMedicines: quickIntakeMedicines => set(({ quickIntakeMedicines })),
  isClearedQuickIntakeMedicines: false,
  setIsClearedQuickIntakeMedicines: isClearedQuickIntakeMedicines => set(({ isClearedQuickIntakeMedicines })),

  // Reminders
  reminders: [],
  setReminders: reminders => set(({ reminders })),
  addReminder: reminder => set(({ reminders }) => ({ reminders: [...reminders, reminder] })),
  updateReminder: (data: Reminder) => set(({ reminders }) => ({
    reminders: reminders.map(reminder => (reminder.id === data.id ? data : reminder))
  })),
  deleteReminder: id => set(({ reminders }) => ({
    reminders: reminders.filter(reminder => reminder.id !== id)
  })),

  // Reminder Medicines
  reminderMedicines: [],
  setReminderMedicines: reminderMedicines => set(({ reminderMedicines })),
  addReminderMedicine: reminderMedicine => set(({ reminderMedicines }) => ({ reminderMedicines: [...reminderMedicines, reminderMedicine] })),
  updateReminderMedicine: (data: ReminderMedicine) => set(({ reminderMedicines }) => ({
    reminderMedicines: reminderMedicines.map(reminderMedicine => (reminderMedicine.id === data.id ? data : reminderMedicine))
  })),
  deleteReminderMedicine: id => set(({ reminderMedicines }) => ({
    reminderMedicines: reminderMedicines.filter(reminderMedicine => reminderMedicine.id !== id)
  })),

  // Shopping List
  shoppingList: [],
  setShoppingList: shoppingList => set(({ shoppingList })),
  addShoppingList: (data: ShoppingList) => set(({ shoppingList }) => ({ shoppingList: [data, ...shoppingList] })),
  updateShoppingList: (data: ShoppingList) => set(({ shoppingList }) => ({
    shoppingList: shoppingList.map(item => (item.id === data.id ? data : item))
  })),
  deleteShoppingList: id => set(({ shoppingList }) => ({
    shoppingList: shoppingList.filter(item => item.id !== id)
  })),

  // Google Drive
  googleDrive: {
    isSignedIn: false,
    setIsSignedIn: isSignedIn => set(({ googleDrive }) => ({ googleDrive: { ...googleDrive, isSignedIn } })),
    isRefetching: false,
    setIsRefetching: isRefetching => set(({ googleDrive }) => ({ googleDrive: { ...googleDrive, isRefetching } })),
  },
  // Local Backups
  localBackups: {
    isRefetching: false,
    setIsRefetching: isRefetching => set(({ localBackups }) => ({ localBackups: { ...localBackups, isRefetching } })),
  }
}))
