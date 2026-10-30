export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const INDONESIAN_DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const INDONESIAN_DAYS_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function formatDateToIndonesian(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    return `${day} ${INDONESIAN_MONTHS[month - 1]} ${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateWithDay(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Sunday is 0, Monday is 1, ..., Saturday is 6
    const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Monday = 0
    return `${INDONESIAN_DAYS_FULL[dayOfWeek]}, ${day} ${INDONESIAN_MONTHS[month - 1]} ${year}`;
  } catch {
    return dateString;
  }
}

export function getMonthYearString(year: number, monthIndex: number): string {
  return `${INDONESIAN_MONTHS[monthIndex]} ${year}`;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Returns index of day for 1st of month, 0 for Monday, 6 for Sunday
 */
export function getFirstDayOfMonth(year: number, monthIndex: number): number {
  const day = new Date(year, monthIndex, 1).getDay();
  return (day + 6) % 7; // Monday = 0, Sunday = 6
}

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function toISODate(year: number, monthIndex: number, day: number): string {
  return `${year}-${padZero(monthIndex + 1)}-${padZero(day)}`;
}

/**
 * Menghitung total hari pelatihan (minimal 1 hari)
 */
export function calculateDurationDays(startDate: string, endDate?: string): number {
  if (!startDate) return 1;
  if (!endDate || endDate <= startDate) return 1;
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

/**
 * Format rentang tanggal ramah bahasa Indonesia
 * Contoh: "26 - 28 Oktober 2026 (3 Hari)" atau "25 Oktober 2026 (1 Hari)"
 */
export function formatDateRangeIndonesian(startDate: string, endDate?: string): string {
  if (!startDate) return '';
  if (!endDate || endDate === startDate) {
    return formatDateToIndonesian(startDate);
  }

  try {
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const totalDays = calculateDurationDays(startDate, endDate);

    if (y1 === y2 && m1 === m2) {
      return `${d1} - ${d2} ${INDONESIAN_MONTHS[m1 - 1]} ${y1} (${totalDays} Hari)`;
    } else if (y1 === y2) {
      return `${d1} ${INDONESIAN_MONTHS[m1 - 1]} - ${d2} ${INDONESIAN_MONTHS[m2 - 1]} ${y1} (${totalDays} Hari)`;
    } else {
      return `${d1} ${INDONESIAN_MONTHS[m1 - 1]} ${y1} - ${d2} ${INDONESIAN_MONTHS[m2 - 1]} ${y2} (${totalDays} Hari)`;
    }
  } catch {
    return `${startDate} - ${endDate}`;
  }
}

/**
 * Mendapatkan posisi hari ke-N dari total hari pelatihan untuk tanggal tertentu
 */
export function getDayNumberInTraining(
  startDate: string, 
  endDate: string | undefined, 
  targetDate: string
): { dayNumber: number; totalDays: number } | null {
  if (!startDate || !targetDate) return null;
  const totalDays = calculateDurationDays(startDate, endDate);
  if (totalDays <= 1) {
    return targetDate === startDate ? { dayNumber: 1, totalDays: 1 } : null;
  }

  try {
    const start = new Date(startDate + 'T00:00:00');
    const target = new Date(targetDate + 'T00:00:00');
    const dayNumber = Math.round((target.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    if (dayNumber >= 1 && dayNumber <= totalDays) {
      return { dayNumber, totalDays };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Menghasilkan array string YYYY-MM-DD dari tanggal mulai sampai selesai
 */
export function generateDateList(startDate: string, endDate?: string): string[] {
  if (!startDate) return [];
  if (!endDate || endDate <= startDate) return [startDate];

  const dates: string[] = [];
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const current = new Date(start);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
  } catch {
    return [startDate];
  }
  return dates;
}
