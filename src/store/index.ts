import { FamilyMember, Medicine, MedicineKit } from '@/services/models'
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
}))
