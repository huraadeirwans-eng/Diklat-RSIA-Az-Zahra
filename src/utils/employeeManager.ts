import { EmployeeItem } from '../types/employee';
import { Training } from '../types/training';
import * as XLSX from 'xlsx';
import { 
  saveEmployeeToFirebase, 
  deleteEmployeeFromFirebase, 
  bulkDeleteEmployeesFromFirebase,
  bulkUploadEmployeesToFirebase, 
  subscribeToEmployees,
  getEmployeesFromFirebase,
  getDeletedEmployeeIds,
  markEmployeesAsDeleted,
  clearDeletedEmployeeTracking
} from '../lib/firebase';

const STORAGE_KEY = 'rsia_az_zahra_data_karyawan_v1';
const EMPLOYEES_CHANGE_EVENT = 'rsia-employees-changed';

export const DEFAULT_EMPLOYEES: EmployeeItem[] = [
  {
    id: 'emp-001',
    name: 'Ns. Siti Rahmawati, S.Kep.',
    idKaryawan: '19920315 201601 2 001',
    jabatan: 'Senior Clinical Preceptor / Perawat Primer',
    unitKerja: 'Nursing Preceptor'
  },
  {
    id: 'emp-002',
    name: 'Bdn. Nurhasanah, S.Tr.Keb.',
    idKaryawan: '19940718 201702 2 004',
    jabatan: 'Bidan Koordinator Kamar Bersalin (VK)',
    unitKerja: 'Delivery Room'
  },
  {
    id: 'emp-003',
    name: 'Ns. Arif Hidayat, S.Kep.',
    idKaryawan: '19890412 201301 1 002',
    jabatan: 'Kepala Ruangan Rawat Inap & PIC Mutu Keperawatan',
    unitKerja: 'Nursing Units Head'
  },
  {
    id: 'emp-004',
    name: 'Bdn. Tri Lestari, A.Md.Keb.',
    idKaryawan: '19951122 201803 2 007',
    jabatan: 'Bidan Pelaksana Poliklinik Kebidanan & Kandungan',
    unitKerja: 'Outpatient'
  },
  {
    id: 'emp-005',
    name: 'Ns. Hendra Pratama, S.Kep.',
    idKaryawan: '19910520 201502 1 005',
    jabatan: 'Perawat Pelaksana ICU & Perawatan Intensif Neonatus (NICU)',
    unitKerja: 'Intensive Care'
  },
  {
    id: 'emp-006',
    name: 'Ns. Maya Indah Permata, S.Kep.',
    idKaryawan: '19930814 201604 2 003',
    jabatan: 'Perawat Kamar Operasi / Instrumentator Bedah',
    unitKerja: 'Operating Theater'
  },
  {
    id: 'emp-007',
    name: 'Bdn. Rina Marlina, S.Tr.Keb.',
    idKaryawan: '19960209 201901 2 009',
    jabatan: 'Bidan Pelaksana Rawat Gabung & Laktasi',
    unitKerja: 'Inpatient'
  },
  {
    id: 'emp-008',
    name: 'Ns. Dedi Kurniawan, A.Md.Kep.',
    idKaryawan: '19901201 201403 1 006',
    jabatan: 'Perawat Pelaksana Instalasi Gawat Darurat (IGD)',
    unitKerja: 'Emergency'
  },
  {
    id: 'emp-009',
    name: 'Bdn. Fitri Handayani, A.Md.Keb.',
    idKaryawan: '19970425 202002 2 011',
    jabatan: 'Bidan Pelaksana Kamar Bersalin',
    unitKerja: 'Delivery Room'
  },
  {
    id: 'emp-010',
    name: 'Ns. Eka Wulandari, S.Kep.',
    idKaryawan: '19940630 201701 2 008',
    jabatan: 'Perawat Primer Rawat Inap Anak & Kebidanan',
    unitKerja: 'Inpatient'
  },
  {
    id: 'emp-011',
    name: 'Ns. Bayu Setiawan, S.Kep.',
    idKaryawan: '19920911 201602 1 010',
    jabatan: 'Perawat Anestesi Kamar Bedah',
    unitKerja: 'Operating Theater'
  },
  {
    id: 'emp-012',
    name: 'Bdn. Anisa Putri, S.Tr.Keb.',
    idKaryawan: '19980115 202101 2 012',
    jabatan: 'Bidan Pelaksana Poliklinik & Skrining Antenatal',
    unitKerja: 'Outpatient'
  }
];

let initialEmployeesCloudSynced = false;

export function getAllEmployees(): EmployeeItem[] {
  let savedEmployees: EmployeeItem[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      savedEmployees = JSON.parse(raw);
    } else if (initialEmployeesCloudSynced) {
      savedEmployees = [];
    } else {
      savedEmployees = [...DEFAULT_EMPLOYEES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEmployees));
    }
  } catch (err) {
    console.error('Failed to read saved employees:', err);
    savedEmployees = [];
  }

  const deletedIds = getDeletedEmployeeIds();
  return savedEmployees.filter((emp) => !deletedIds.has(emp.id));
}

export function saveEmployee(emp: Omit<EmployeeItem, 'id'> & { id?: string }): EmployeeItem {
  const current = getAllEmployees();
  const newItem: EmployeeItem = {
    id: emp.id || `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: emp.name.trim(),
    idKaryawan: emp.idKaryawan.trim(),
    jabatan: emp.jabatan.trim(),
    unitKerja: emp.unitKerja.trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [newItem, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: updated }));
  saveEmployeeToFirebase(newItem).catch(() => {});
  return newItem;
}

export function updateEmployee(id: string, fields: Partial<EmployeeItem>): boolean {
  const current = getAllEmployees();
  let found = false;
  let updatedItem: EmployeeItem | null = null;
  const updated = current.map((emp) => {
    if (emp.id === id) {
      found = true;
      updatedItem = {
        ...emp,
        ...fields,
        updatedAt: new Date().toISOString()
      };
      return updatedItem;
    }
    return emp;
  });

  if (found && updatedItem) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: updated }));
    saveEmployeeToFirebase(updatedItem).catch(() => {});
  }
  return found;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  markEmployeesAsDeleted([id]);
  const current = getAllEmployees();
  const filtered = current.filter((emp) => emp.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: filtered }));
  try {
    await deleteEmployeeFromFirebase(id);
  } catch {
    // ignore
  }
  return true;
}

export async function bulkDeleteEmployees(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  markEmployeesAsDeleted(ids);
  const idSet = new Set(ids);
  const current = getAllEmployees();
  const filtered = current.filter((emp) => !idSet.has(emp.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: filtered }));
  try {
    await bulkDeleteEmployeesFromFirebase(ids);
  } catch {
    // ignore
  }
  return true;
}

export async function bulkSaveEmployees(newEmployees: Omit<EmployeeItem, 'id'>[]): Promise<{ count: number; cloudSynced: boolean }> {
  const current = getAllEmployees();
  
  // Check if current list is just the default template
  const isOnlyDefaults = current.length === DEFAULT_EMPLOYEES.length && 
    current.every(c => DEFAULT_EMPLOYEES.some(d => d.id === c.id));

  const baseList = isOnlyDefaults ? [] : [...current];
  const existingMap = new Map<string, EmployeeItem>();
  baseList.forEach(e => {
    const key = (e.idKaryawan || e.name).toLowerCase().trim();
    existingMap.set(key, e);
  });

  let savedCount = 0;
  newEmployees.forEach((e, idx) => {
    const key = (e.idKaryawan || e.name).toLowerCase().trim();
    if (!key) return;

    if (existingMap.has(key)) {
      const existing = existingMap.get(key)!;
      existingMap.set(key, {
        ...existing,
        name: e.name.trim(),
        idKaryawan: e.idKaryawan.trim(),
        jabatan: e.jabatan.trim(),
        unitKerja: e.unitKerja.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const newItem: EmployeeItem = {
        id: `emp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: e.name.trim(),
        idKaryawan: e.idKaryawan.trim(),
        jabatan: e.jabatan.trim(),
        unitKerja: e.unitKerja.trim(),
        createdAt: new Date().toISOString()
      };
      existingMap.set(key, newItem);
    }
    savedCount++;
  });

  const updated = Array.from(existingMap.values());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: updated }));

  // Sync to Cloud Firestore
  let cloudSynced = false;
  try {
    cloudSynced = await bulkUploadEmployeesToFirebase(updated);
  } catch (err) {
    console.warn('Failed to bulk sync employees to Firebase:', err);
  }

  return { count: savedCount, cloudSynced };
}

export function resetEmployeesToDefault(): void {
  clearDeletedEmployeeTracking();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
  window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: DEFAULT_EMPLOYEES }));
  bulkUploadEmployeesToFirebase(DEFAULT_EMPLOYEES).catch(() => {});
}

export function onEmployeesChange(callback: (employees?: EmployeeItem[]) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<EmployeeItem[]>;
    callback(custom.detail);
  };
  window.addEventListener(EMPLOYEES_CHANGE_EVENT, handler);
  return () => window.removeEventListener(EMPLOYEES_CHANGE_EVENT, handler);
}

/**
 * Start real-time Firestore sync for master employees directory
 */
export function startRealtimeEmployeeSync(): () => void {
  return subscribeToEmployees((remoteEmployees) => {
    initialEmployeesCloudSynced = true;
    const deletedIds = getDeletedEmployeeIds();
    const cleanRemote = Array.isArray(remoteEmployees)
      ? remoteEmployees.filter((e) => !deletedIds.has(e.id))
      : [];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanRemote));
      window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: cleanRemote }));
    } catch (err) {
      console.warn('Failed to update local employees cache:', err);
    }
  });
}

/**
 * Manually force-fetch or push employees to Cloud Firestore
 */
export async function forceSyncEmployeesWithCloud(): Promise<{ count: number; success: boolean }> {
  try {
    const remote = await getEmployeesFromFirebase();
    const deletedIds = getDeletedEmployeeIds();
    const cleanRemote = (remote || []).filter((e) => !deletedIds.has(e.id));

    if (cleanRemote && cleanRemote.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanRemote));
      window.dispatchEvent(new CustomEvent(EMPLOYEES_CHANGE_EVENT, { detail: cleanRemote }));
      return { count: cleanRemote.length, success: true };
    } else {
      const local = getAllEmployees();
      return { count: local.length, success: true };
    }
  } catch (err) {
    console.error('Force employee sync error:', err);
    return { count: 0, success: false };
  }
}

// Download template Excel resmi untuk Data Karyawan RSIA Az Zahra
// Format Standar: No | NAMA LENGKAP | nik | JABATAN | UNIT KERJA
export function downloadEmployeeExcelTemplate(): void {
  const templateHeaders = [
    [
      'No',
      'NAMA LENGKAP',
      'nik',
      'JABATAN',
      'UNIT KERJA'
    ],
    // Contoh Data Karyawan RSIA Az Zahra
    ['1', 'Ns. Siti Rahmawati, S.Kep.', '19920315 201601 2 001', 'Senior Clinical Preceptor / Perawat Primer', 'Nursing Preceptor'],
    ['2', 'Bdn. Nurhasanah, S.Tr.Keb.', '19940718 201702 2 004', 'Bidan Koordinator Kamar Bersalin (VK)', 'Delivery Room'],
    ['3', 'Ns. Arif Hidayat, S.Kep.', '19890412 201301 1 002', 'Kepala Ruangan Rawat Inap & PIC Mutu', 'Nursing Units Head'],
    ['4', 'Bdn. Tri Lestari, A.Md.Keb.', '19951122 201803 2 007', 'Bidan Pelaksana Poliklinik Kandungan', 'Outpatient'],
    ['5', 'Ns. Hendra Pratama, S.Kep.', '19910520 201502 1 005', 'Perawat Pelaksana ICU & Perawatan Intensif (NICU)', 'Intensive Care'],
    ['6', 'Bdn. Rina Marlina, S.Tr.Keb.', '19960209 201901 2 009', 'Bidan Pelaksana Rawat Gabung & Laktasi', 'Inpatient'],
    ['7', 'Ns. Dedi Kurniawan, A.Md.Kep.', '19901201 201403 1 006', 'Perawat Pelaksana Instalasi Gawat Darurat (IGD)', 'Emergency'],
    ['8', 'Bdn. Fitri Handayani, A.Md.Keb.', '19970425 202002 2 011', 'Bidan Pelaksana Kamar Bersalin', 'Delivery Room'],
    ['9', 'Ns. Eka Wulandari, S.Kep.', '19940630 201701 2 008', 'Perawat Primer Rawat Inap Anak', 'Inpatient'],
    ['10', 'Bdn. Anisa Putri, S.Tr.Keb.', '19980115 202101 2 012', 'Bidan Pelaksana Antenatal Care', 'Outpatient']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateHeaders);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 28 },
    { wch: 44 },
    { wch: 28 }
  ];

  // Sheet 2: Panduan Pengisian
  const guideData = [
    ['PANDUAN PENGISIAN TEMPLATE INPUT EXCEL DATA KARYAWAN'],
    [''],
    ['Format Kolom Wajib:'],
    ['1. No          : Nomor urut baris data (1, 2, 3, dst).'],
    ['2. NAMA LENGKAP: Nama lengkap karyawan beserta gelar (contoh: Ns. Siti Rahmawati, S.Kep. atau Bdn. Nurhasanah, S.Tr.Keb.).'],
    ['3. nik         : Nomor Induk Karyawan atau NIP institusi yang unik.'],
    ['4. JABATAN     : Nama jabatan / profesi (contoh: Perawat Pelaksana, Bidan Koordinator, Katim, Kepala Ruangan).'],
    ['5. UNIT KERJA  : Nama unit kerja / ruangan (contoh: Delivery Room, Inpatient, Emergency, ICU/NICU, Outpatient).'],
    [''],
    ['Catatan: Jangan mengubah susunan nama kolom pada baris pertama agar sistem dapat membaca data secara otomatis.']
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guideData);
  guideSheet['!cols'] = [{ wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Karyawan');
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Panduan_Format');
  XLSX.writeFile(workbook, 'Template_Input_Data_Karyawan_RSIA_AzZahra.xlsx');
}

// Export seluruh data karyawan ke Excel dengan format: No | NAMA LENGKAP | nik | JABATAN | UNIT KERJA
export function exportEmployeesToExcel(employees: EmployeeItem[]): void {
  const dataRows = [
    ['No', 'NAMA LENGKAP', 'nik', 'JABATAN', 'UNIT KERJA']
  ];

  employees.forEach((emp, index) => {
    dataRows.push([
      String(index + 1),
      emp.name,
      emp.idKaryawan,
      emp.jabatan,
      emp.unitKerja
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 28 },
    { wch: 44 },
    { wch: 28 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Karyawan');
  XLSX.writeFile(workbook, `Data_Karyawan_RSIA_AZ_ZAHRA_${new Date().toISOString().split('T')[0]}.xlsx`);
}
