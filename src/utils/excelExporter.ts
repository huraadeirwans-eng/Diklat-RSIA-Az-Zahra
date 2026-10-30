import * as XLSX from 'xlsx';
import { Training } from '../types/training';
import { getEffectiveScores } from './evaluationHelper';

export function exportCompleteAgendaToExcel(trainings: Training[], filenamePrefix: string = 'Agenda_Pelatihan_RSIA_AZ') {
  // 1. Sheet 1: Master Agenda
  const agendaData = trainings.map((t, idx) => {
    const hadir = t.participants.filter((p) => p.statusKehadiran === 'Hadir').length;
    const izin = t.participants.filter((p) => p.statusKehadiran === 'Izin').length;
    const terdaftar = t.participants.filter((p) => p.statusKehadiran === 'Terdaftar').length;
    const konfirmasi = t.participants.filter((p) => p.statusKehadiran === 'Konfirmasi').length;
    return {
      'No': idx + 1,
      'Kode Pelatihan': t.code,
      'Judul Pelatihan': t.title,
      'Kategori': t.category,
      'Lingkup': t.scope || 'Internal',
      'Tanggal': t.date,
      'Tanggal Selesai': t.endDate || t.date,
      'Waktu Mulai': t.startTime,
      'Waktu Selesai': t.endTime,
      'Jam Pembelajaran (JP)': t.sksHours,
      'Ruangan / Tempat': t.venue,
      'Tipe Lokasi': t.locationType,
      'Instruktur': t.instructor.name,
      'Gelar / Jabatan': t.instructor.title,
      'Instansi Instruktur': t.instructor.organization,
      'Kapasitas Kuota': t.capacity,
      'Total Peserta': t.participants.length,
      'Hadir': hadir,
      'Izin': izin,
      'Terdaftar': terdaftar,
      'Konfirmasi': konfirmasi,
      'Status Pelatihan': t.status,
      'Persentase Hadir': t.participants.length > 0 ? `${Math.round((hadir / t.participants.length) * 100)}%` : '0%'
    };
  });

  // 2. Sheet 2: Detail Seluruh Peserta
  const participantsData: any[] = [];
  trainings.forEach((t) => {
    t.participants.forEach((p, pIdx) => {
      const scores = getEffectiveScores(p);
      participantsData.push({
        'Kode Pelatihan': t.code,
        'Judul Pelatihan': t.title,
        'Tanggal Pelatihan': t.date,
        'No Urut': pIdx + 1,
        'NIK Peserta': p.nip,
        'Nama Peserta': p.name,
        'Unit Kerja': p.unitKerja,
        'Jabatan': p.jabatan,
        'Email': p.email,
        'No Telepon': p.phone,
        'Status Kehadiran': p.statusKehadiran,
        'Pre-test': scores.pre,
        'Post-test': scores.post,
        'Selisih Nilai': `${scores.delta >= 0 ? '+' : ''}${scores.delta}`,
        'Waktu Terdaftar': p.registeredAt,
        'Catatan': p.catatan || '-'
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const wsAgenda = XLSX.utils.json_to_sheet(agendaData);
  const wsPeserta = XLSX.utils.json_to_sheet(participantsData);

  XLSX.utils.book_append_sheet(wb, wsAgenda, 'Agenda Pelatihan');
  XLSX.utils.book_append_sheet(wb, wsPeserta, 'Daftar Peserta');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}
