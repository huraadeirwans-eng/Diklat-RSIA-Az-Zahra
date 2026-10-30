export type AttendanceStatus = 'Hadir' | 'Terdaftar' | 'Izin' | 'Konfirmasi';

export interface Participant {
  id: string;
  name: string;
  nip: string;
  unitKerja: string;
  jabatan: string;
  email?: string;
  phone?: string;
  statusKehadiran: AttendanceStatus;
  nilaiPretest?: number;
  nilaiPosttest?: number;
  catatan?: string;
  registeredAt: string;
}

export type TrainingCategory = 
  | 'Teknologi & Digital'
  | 'Kepemimpinan & Manajerial'
  | 'K3 & Lingkungan'
  | 'Keuangan & Audit'
  | 'Operasional & Layanan'
  | 'Tata Kelola & Kepatuhan';

export type TrainingStatus = 'Terjadwal' | 'Sedang Berlangsung' | 'Selesai' | 'Ditunda';

export type TrainingScope = 'Internal' | 'Eksternal';

export interface Instructor {
  name: string;
  title: string;
  organization: string;
  avatarUrl?: string;
}

export interface DailyScheduleItem {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  topic?: string;
  startTime?: string;
  endTime?: string;
}

export interface Training {
  id: string;
  code: string;
  title: string;
  category: TrainingCategory;
  scope?: TrainingScope; // 'Internal' atau 'Eksternal'
  date: string; // ISO string YYYY-MM-DD (Tanggal Mulai)
  endDate?: string; // ISO string YYYY-MM-DD (Tanggal Selesai jika > 1 hari)
  dailySchedules?: DailyScheduleItem[]; // Rincian agenda/topik per hari
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "16:00"
  locationType: 'Offline' | 'Online' | 'Online (Zoom)' | 'Hybrid';
  venue: string;
  instructor: Instructor;
  capacity: number;
  status: TrainingStatus;
  description: string;
  learningObjectives: string[];
  sksHours: number; // Jam Pembelajaran (JP)
  participants: Participant[];
  colorTheme: string; // Tailored aerodynamic accents
  targetUnits?: string[]; // Unit Kerja Sasaran
  // Dokumen & Media Tambahan (Khusus Pelatihan Eksternal)
  certificateUrl?: string; // Data URL Base64 atau URL file Sertifikat
  certificateFileName?: string;
  posterUrl?: string; // Data URL Base64 atau URL file Poster / Brosur
  posterFileName?: string;
}

export interface UnitKerjaStats {
  name: string;
  participantCount: number;
  completedCount: number;
  trainingsCount: number;
}
