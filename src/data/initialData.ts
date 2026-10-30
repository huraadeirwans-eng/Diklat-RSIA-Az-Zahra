import { Training } from '../types/training';

export const ALL_UNIT_KERJA: string[] = [
  'Nursing Units Head',
  'Nursing Preceptor',
  'Outpatient',
  'Intensive Care',
  'Inpatient',
  'Operating Theater',
  'Emergency',
  'Delivery Room',
  'Radiology',
  'Pharmacy',
  'Laboratory',
  'Medical Record',
  'Medical Rehab',
  'CSSD',
  'Nutrition',
  'Finance & Accounting',
  'Cashier',
  'Information Technology',
  'Asset & Procurement',
  'Inventory',
  'Data Analyst',
  'HC',
  'FMGA',
  'DRIVER',
  'Customer Relation & Marketing',
  'Outsourcing'
];

export const INITIAL_TRAININGS: Training[] = [
  {
    id: 'trn-001',
    code: 'TRN-CYBER-2026-08',
    title: 'Sertifikasi Keamanan Siber & ISO 27001 Information Security Management',
    category: 'Teknologi & Digital',
    scope: 'Eksternal',
    date: '2026-10-25',
    startTime: '08:30',
    endTime: '16:00',
    locationType: 'Hybrid',
    venue: 'Auditorium Cyber Lab Lt. 5 & Zoom Meeting Room 1',
    instructor: {
      name: 'Dr. Ir. Bambang Wicaksono, M.Kom., CISA, CISSP',
      title: 'Principal Security Architect & Lead ISO 27001 Assessor',
      organization: 'Cybersecurity Defense Institute'
    },
    capacity: 35,
    status: 'Sedang Berlangsung',
    description: 'Pelatihan intensif pemenuhan standar keamanan siber enterprise, audit kerentanan sistem, manajemen insiden kebocoran data, dan tata kelola ISO/IEC 27001:2022.',
    learningObjectives: [
      'Memahami arsitektur kendali keamanan informasi ISO 27001',
      'Mendeteksi dan merespon insiden ransomware & phishing',
      'Menyusun Standard Operating Procedure (SOP) mitigasi insiden siber',
      'Mengembangkan mitigasi risiko data privasi sesuai UU PDP'
    ],
    sksHours: 8,
    colorTheme: 'cyan',
    certificateUrl: '/assets/images/certificate_sample_diklat.svg',
    certificateFileName: 'Sertifikat_Akreditasi_ISO27001_Eksternal.svg',
    posterUrl: '/assets/images/poster_sample_diklat.svg',
    posterFileName: 'Poster_Simposium_Eksternal_CyberSecurity.svg',
    participants: [
      {
        id: 'p-101',
        name: 'Ahmad Faisal, S.Kom.',
        nip: '19890412 201402 1 003',
        unitKerja: 'Information Technology',
        jabatan: 'Senior Network & Security Engineer',
        email: 'ahmad.faisal@coorporate.co.id',
        phone: '+62 812-4567-8901',
        statusKehadiran: 'Hadir',
        nilaiPretest: 78,
        nilaiPosttest: 94,
        registeredAt: '2026-10-10'
      },
      {
        id: 'p-102',
        name: 'Dewi Anggraeni, S.T., M.T.',
        nip: '19910624 201601 2 004',
        unitKerja: 'Information Technology',
        jabatan: 'Database Administrator Specialist',
        email: 'dewi.anggraeni@coorporate.co.id',
        phone: '+62 813-8877-6655',
        statusKehadiran: 'Hadir',
        nilaiPretest: 82,
        nilaiPosttest: 96,
        registeredAt: '2026-10-11'
      },
      {
        id: 'p-103',
        name: 'Budi Santoso, S.E.',
        nip: '19870315 201103 1 001',
        unitKerja: 'Data Analyst',
        jabatan: 'Kepala Sub-Divisi Mitigasi Risiko TI',
        email: 'budi.santoso@coorporate.co.id',
        phone: '+62 811-2233-4455',
        statusKehadiran: 'Hadir',
        nilaiPretest: 70,
        nilaiPosttest: 88,
        registeredAt: '2026-10-12'
      },
      {
        id: 'p-104',
        name: 'Siti Nurhaliza, S.H.',
        nip: '19930819 201802 2 005',
        unitKerja: 'Medical Record',
        jabatan: 'Legal Counsel Perlindungan Data Pribadi',
        email: 'siti.nurhaliza@coorporate.co.id',
        phone: '+62 856-7788-9900',
        statusKehadiran: 'Hadir',
        nilaiPretest: 65,
        nilaiPosttest: 85,
        registeredAt: '2026-10-12'
      },
      {
        id: 'p-105',
        name: 'Rian Pratama, S.Kom.',
        nip: '19951103 201901 1 006',
        unitKerja: 'Information Technology',
        jabatan: 'DevOps & Infrastructure Officer',
        email: 'rian.pratama@coorporate.co.id',
        phone: '+62 878-1234-5678',
        statusKehadiran: 'Hadir',
        nilaiPretest: 85,
        nilaiPosttest: 98,
        registeredAt: '2026-10-14'
      },
      {
        id: 'p-106',
        name: 'Mega Puspita, S.E.',
        nip: '19920512 201701 2 003',
        unitKerja: 'Finance & Accounting',
        jabatan: 'Analis Keamanan Transaksi Finansial',
        email: 'mega.puspita@coorporate.co.id',
        phone: '+62 812-9988-7711',
        statusKehadiran: 'Terdaftar',
        nilaiPretest: 68,
        registeredAt: '2026-10-15'
      },
      {
        id: 'p-107',
        name: 'Kurniawan Wijaya, S.T.',
        nip: '19881204 201302 1 002',
        unitKerja: 'Operating Theater',
        jabatan: 'Supervisor Sistem Otomasi Gudang',
        email: 'kurniawan.w@coorporate.co.id',
        phone: '+62 813-4455-6677',
        statusKehadiran: 'Hadir',
        nilaiPretest: 72,
        nilaiPosttest: 86,
        registeredAt: '2026-10-15'
      }
    ]
  },
  {
    id: 'trn-002',
    code: 'TRN-LDR-2026-10',
    title: 'Transformational Leadership & Agile Change Management bagi Eksekutif Muda',
    category: 'Kepemimpinan & Manajerial',
    scope: 'Internal',
    date: '2026-10-25',
    startTime: '13:00',
    endTime: '17:00',
    locationType: 'Offline',
    venue: 'Executive Boardroom Lt. 8',
    instructor: {
      name: 'Prof. Dr. Hendra Gunawan, M.M., PCC',
      title: 'Senior Executive Coach & Organization Strategy Consultant',
      organization: 'Center for Strategic Leadership'
    },
    capacity: 25,
    status: 'Terjadwal',
    description: 'Program akselerasi kompetensi manajerial dalam mengarahkan perubahan organisasi, membangun budaya kolaboratif lintas unit, dan memimpin tim dengan pendekatan Agile.',
    learningObjectives: [
      'Menavigasi dinamika perubahan organisasi dengan kerangka kerja Kotter 8-Step',
      'Menerapkan teknik coaching dan umpan balik konstruktif',
      'Mengelola resistensi dan menyelaraskan target unit kerja dengan KPI korporasi'
    ],
    sksHours: 4,
    colorTheme: 'purple',
    participants: [
      {
        id: 'p-201',
        name: 'Ir. Hendro Cahyono, M.T.',
        nip: '19840210 200901 1 002',
        unitKerja: 'Operating Theater',
        jabatan: 'Manager Logistik Regional',
        email: 'hendro.cahyono@coorporate.co.id',
        phone: '+62 811-9988-2233',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-05'
      },
      {
        id: 'p-202',
        name: 'Ratna Kusuma Dewi, S.Psi., M.M.',
        nip: '19870914 201102 2 001',
        unitKerja: 'HC',
        jabatan: 'Kepala Bagian Pengembangan Talenta',
        email: 'ratna.kusuma@coorporate.co.id',
        phone: '+62 812-7711-2233',
        statusKehadiran: 'Hadir',
        registeredAt: '2026-10-06'
      },
      {
        id: 'p-203',
        name: 'Eko Prasetyo, S.E., Ak.',
        nip: '19860418 201001 1 004',
        unitKerja: 'Finance & Accounting',
        jabatan: 'Senior Accounting & Tax Manager',
        email: 'eko.prasetyo@coorporate.co.id',
        phone: '+62 813-2211-9944',
        statusKehadiran: 'Hadir',
        registeredAt: '2026-10-08'
      },
      {
        id: 'p-204',
        name: 'Nadia Salsabila, S.I.Kom.',
        nip: '19920320 201602 2 003',
        unitKerja: 'Customer Relation & Marketing',
        jabatan: 'Brand Strategist & External Relation Lead',
        email: 'nadia.salsabila@coorporate.co.id',
        phone: '+62 857-3344-5566',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-09'
      },
      {
        id: 'p-205',
        name: 'Fajar Nugraha, S.T.',
        nip: '19891005 201401 1 005',
        unitKerja: 'Asset & Procurement',
        jabatan: 'Manager Pengadaan Barang & Jasa',
        email: 'fajar.nugraha@coorporate.co.id',
        phone: '+62 819-0123-4567',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-10'
      }
    ]
  },
  {
    id: 'trn-003',
    code: 'TRN-K3-2026-14',
    title: 'Pelatihan Ahli K3 Umum & Manajemen Tanggap Darurat Bencana Industri',
    category: 'K3 & Lingkungan',
    scope: 'Eksternal',
    date: '2026-10-26',
    endDate: '2026-10-28',
    dailySchedules: [
      {
        dayNumber: 1,
        date: '2026-10-26',
        topic: 'Regulasi SMK3 PP 50/2012 & Identifikasi Bahaya Kerja (HIRADC)',
        startTime: '08:00',
        endTime: '15:30'
      },
      {
        dayNumber: 2,
        date: '2026-10-27',
        topic: 'Pengelolaan Limbah B3, Ergonomi Klinis & Kesiapsiagaan Fasilitas',
        startTime: '08:00',
        endTime: '15:30'
      },
      {
        dayNumber: 3,
        date: '2026-10-28',
        topic: 'Praktikum Simulasi Evakuasi Tanggap Darurat & Ujian Sertifikasi K3',
        startTime: '08:00',
        endTime: '15:30'
      }
    ],
    startTime: '08:00',
    endTime: '15:30',
    locationType: 'Offline',
    venue: 'Pusat Pelatihan K3 & Safety Zone Area Barat',
    instructor: {
      name: 'Ir. Agus Suryanto, M.KKK., CSP',
      title: 'Senior Industrial Hygienist & Kemenaker Certified Safety Specialist',
      organization: 'Badan Sertifikasi Keselamatan Kerja Nasional'
    },
    capacity: 30,
    status: 'Terjadwal',
    description: 'Penyegaran protokol keselamatan dan kesehatan kerja (SMK3 PP 50/2012), identifikasi bahaya kerja (HIRADC), dan simulasi evakuasi darurat operasional.',
    learningObjectives: [
      'Menyusun dokumen HIRADC (Hazard Identification Risk Assessment)',
      'Memahami regulasi keselamatan fasilitas dan penanganan limbah B3',
      'Memimpin regu tanggap darurat saat insiden kebakaran/gempa'
    ],
    sksHours: 7,
    colorTheme: 'emerald',
    certificateUrl: '/assets/images/certificate_sample_diklat.svg',
    certificateFileName: 'Sertifikat_Ahli_K3_Umum_BNSP.svg',
    posterUrl: '/assets/images/poster_sample_diklat.svg',
    posterFileName: 'Poster_Pelatihan_K3_Tanggap_Darurat.svg',
    participants: [
      {
        id: 'p-301',
        name: 'Bambang Irawan, S.T.',
        nip: '19900115 201501 1 002',
        unitKerja: 'Emergency',
        jabatan: 'Koordinator Safety Inspeksi',
        email: 'bambang.irawan@coorporate.co.id',
        phone: '+62 812-3322-1100',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-01'
      },
      {
        id: 'p-302',
        name: 'Yogi Saputra, A.Md.',
        nip: '19940711 201801 1 007',
        unitKerja: 'Asset & Procurement',
        jabatan: 'Teknisi Utilitas Gedung & MEP',
        email: 'yogi.saputra@coorporate.co.id',
        phone: '+62 856-4433-2211',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-03'
      },
      {
        id: 'p-303',
        name: 'Rina Marlina, S.KM.',
        nip: '19931120 201702 2 004',
        unitKerja: 'Emergency',
        jabatan: 'Occupational Health Officer',
        email: 'rina.marlina@coorporate.co.id',
        phone: '+62 813-9900-1122',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-05'
      },
      {
        id: 'p-304',
        name: 'Dodi Haryanto',
        nip: '19880628 201201 1 003',
        unitKerja: 'Operating Theater',
        jabatan: 'Fleet & Warehouse Safety Supervisor',
        email: 'dodi.haryanto@coorporate.co.id',
        phone: '+62 878-5566-7788',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-06'
      },
      {
        id: 'p-305',
        name: 'Fitriani Lestari, S.Psi.',
        nip: '19950814 201902 2 002',
        unitKerja: 'HC',
        jabatan: 'Staff Kesejahteraan & Employee Wellness',
        email: 'fitriani.lestari@coorporate.co.id',
        phone: '+62 812-7788-9944',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-07'
      }
    ]
  },
  {
    id: 'trn-004',
    code: 'TRN-FIN-2026-05',
    title: 'Financial Modeling, Analisis Kelayakan Investasi, & Corporate Valuation',
    category: 'Keuangan & Audit',
    scope: 'Eksternal',
    date: '2026-10-28',
    startTime: '09:00',
    endTime: '16:30',
    locationType: 'Online (Zoom)',
    venue: 'Zoom Executive Learning Room B',
    instructor: {
      name: 'David Kurnia, CFA, FRM',
      title: 'Managing Director & Strategic Finance Advisor',
      organization: 'Capital Advisory Partners'
    },
    capacity: 40,
    status: 'Terjadwal',
    description: 'Pemodelan keuangan terintegrasi tiga laporan keuangan (Income Statement, Balance Sheet, Cash Flow), evaluasi NPV/IRR proyek strategis, dan teknik valuasi DCF.',
    learningObjectives: [
      'Menyusun model proyeksi keuangan dinamis dengan skenario sensitivity analysis',
      'Menghitung WACC dan Cost of Equity untuk proyeksi investasi baru',
      'Mendeteksi red flags dalam laporan keuangan anak perusahaan'
    ],
    sksHours: 6,
    colorTheme: 'blue',
    certificateUrl: '/assets/images/certificate_sample_diklat.svg',
    certificateFileName: 'Sertifikat_Valuasi_Financial_Modeling.svg',
    posterUrl: '/assets/images/poster_sample_diklat.svg',
    posterFileName: 'Poster_Workshop_Financial_Modeling.svg',
    participants: [
      {
        id: 'p-401',
        name: 'Indra Permana, S.E., M.Sc.',
        nip: '19900222 201402 1 001',
        unitKerja: 'Finance & Accounting',
        jabatan: 'Senior Financial Analyst',
        email: 'indra.permana@coorporate.co.id',
        phone: '+62 811-7788-2233',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-12'
      },
      {
        id: 'p-402',
        name: 'Citra Wulandari, S.E., Ak.',
        nip: '19920910 201601 2 005',
        unitKerja: 'Finance & Accounting',
        jabatan: 'Staff Budgeting & Treasury',
        email: 'citra.wulandari@coorporate.co.id',
        phone: '+62 812-4455-8899',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-14'
      },
      {
        id: 'p-403',
        name: 'Gilang Ramadhan, S.T., M.M.',
        nip: '19890715 201301 1 003',
        unitKerja: 'Data Analyst',
        jabatan: 'Analis Risiko Finansial & Pasar',
        email: 'gilang.ramadhan@coorporate.co.id',
        phone: '+62 813-1122-3344',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-14'
      },
      {
        id: 'p-404',
        name: 'Maya Kartika, S.M.',
        nip: '19940125 201802 2 001',
        unitKerja: 'Customer Relation & Marketing',
        jabatan: 'Revenue Growth & Pricing Analyst',
        email: 'maya.kartika@coorporate.co.id',
        phone: '+62 856-1122-8877',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-15'
      }
    ]
  },
  {
    id: 'trn-005',
    code: 'TRN-AI-2026-03',
    title: 'Penerapan Generative AI & Automation untuk Efisiensi Alur Kerja Kantor',
    category: 'Teknologi & Digital',
    scope: 'Internal',
    date: '2026-10-30',
    startTime: '09:00',
    endTime: '15:00',
    locationType: 'Hybrid',
    venue: 'Innovation Hub Lt. 3 & Zoom Live Stream',
    instructor: {
      name: 'Sonia Maharani, Ph.D.',
      title: 'Head of Enterprise AI Solutions',
      organization: 'National AI Center'
    },
    capacity: 50,
    status: 'Terjadwal',
    description: 'Pemanfaatan kecerdasan artifisial generatif, pembuatan prompt engineer untuk analisis dokumen hukum, rekapitulasi data otomatis, serta otomasi alur kerja tanpa koding.',
    learningObjectives: [
      'Menerapkan prompt engineering tingkat lanjut untuk tugas coorporate',
      'Menganalisis resume laporan tahunan secara akurat menggunakan AI',
      'Mencegah risiko kebocoran data rahasia korporasi (AI Governance)'
    ],
    sksHours: 5,
    colorTheme: 'cyan',
    participants: [
      {
        id: 'p-501',
        name: 'Wahyu Hidayat, S.Kom.',
        nip: '19930415 201701 1 004',
        unitKerja: 'Information Technology',
        jabatan: 'Full-stack Developer Specialist',
        email: 'wahyu.hidayat@coorporate.co.id',
        phone: '+62 812-9900-5544',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-18'
      },
      {
        id: 'p-502',
        name: 'Anisa Triastuti, S.Psi.',
        nip: '19950310 201902 2 003',
        unitKerja: 'HC',
        jabatan: 'Officer People Analytics',
        email: 'anisa.triastuti@coorporate.co.id',
        phone: '+62 813-2233-1199',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-19'
      },
      {
        id: 'p-503',
        name: 'Teguh Wicaksono, S.H.',
        nip: '19910822 201502 1 002',
        unitKerja: 'Medical Record',
        jabatan: 'Staff Analis Regulasi Bisnis',
        email: 'teguh.w@coorporate.co.id',
        phone: '+62 857-4433-2211',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-20'
      },
      {
        id: 'p-504',
        name: 'Melinda Safitri, S.I.Kom.',
        nip: '19961205 202102 2 001',
        unitKerja: 'Customer Relation & Marketing',
        jabatan: 'Social Media & Content Strategist',
        email: 'melinda.safitri@coorporate.co.id',
        phone: '+62 878-9900-3322',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-21'
      },
      {
        id: 'p-505',
        name: 'Arief Budiman, S.T.',
        nip: '19890614 201301 1 006',
        unitKerja: 'Operating Theater',
        jabatan: 'Supply Chain Optimization Engineer',
        email: 'arief.budiman@coorporate.co.id',
        phone: '+62 811-4455-6688',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-22'
      }
    ]
  },
  {
    id: 'trn-006',
    code: 'TRN-SRV-2026-09',
    title: 'Service Excellence & Resolusi Keluhan Konsumen Berorientasi Solusi',
    category: 'Operasional & Layanan',
    scope: 'Internal',
    date: '2026-11-02',
    startTime: '08:30',
    endTime: '15:30',
    locationType: 'Offline',
    venue: 'Training Hall Melati Lt. 2',
    instructor: {
      name: 'Maria Vanda, S.E., M.M.',
      title: 'Customer Experience Transformation Master Trainer',
      organization: 'Service Quality Institute Indonesia'
    },
    capacity: 35,
    status: 'Terjadwal',
    description: 'Peningkatan standar hospitality korporasi, etika komunikasi interpersonal prima, empati aktif dalam meredam eskalasi keluhan nasabah prioritas, dan digital omnichannel support.',
    learningObjectives: [
      'Menerapkan framework de-eskalasi konflik LAST (Listen, Apologize, Solve, Thank)',
      'Meningkatkan skor Customer Satisfaction Index (CSI) dan Net Promoter Score (NPS)',
      'Standarisasi komunikasi verbal dan tertulis perwakilan korporasi'
    ],
    sksHours: 6,
    colorTheme: 'amber',
    participants: [
      {
        id: 'p-601',
        name: 'Nur Aini Farida, A.Md.',
        nip: '19970514 202001 2 004',
        unitKerja: 'Customer Relation & Marketing',
        jabatan: 'Senior Customer Service Representative',
        email: 'nur.aini@coorporate.co.id',
        phone: '+62 812-7711-4499',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-15'
      },
      {
        id: 'p-602',
        name: 'Rizky Maulana, S.M.',
        nip: '19941018 201801 1 003',
        unitKerja: 'Operating Theater',
        jabatan: 'Supervisor Layanan Pengantaran & Distribusi',
        email: 'rizky.maulana@coorporate.co.id',
        phone: '+62 813-8899-7722',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-16'
      },
      {
        id: 'p-603',
        name: 'Yunita Sari, S.E.',
        nip: '19930219 201702 2 002',
        unitKerja: 'Asset & Procurement',
        jabatan: 'Front Office & Tenant Relationship Lead',
        email: 'yunita.sari@coorporate.co.id',
        phone: '+62 856-3322-1144',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-17'
      }
    ]
  },
  {
    id: 'trn-007',
    code: 'TRN-GOV-2026-02',
    title: 'Audit Internal Berbasis Risiko & Anti-Bribery Management System (ISO 37001)',
    category: 'Tata Kelola & Kepatuhan',
    scope: 'Eksternal',
    date: '2026-11-05',
    startTime: '09:00',
    endTime: '16:00',
    locationType: 'Hybrid',
    venue: 'Ruang Rapat Integritas Lt. 6 & Zoom VIP',
    instructor: {
      name: 'Dr. H. Rusdiansyah, Ak., CA, CRMA',
      title: 'Senior Forensic Auditor & Komite Tata Kelola',
      organization: 'Ikatan Auditor Governance Indonesia'
    },
    capacity: 25,
    status: 'Terjadwal',
    description: 'Penerapan Sistem Manajemen Anti Penyuapan (SMAP ISO 37001:2016), mekanisme pelaporan Whistleblowing System (WBS), uji kelayakan rekanan pihak ketiga, dan investigasi kecurangan internal.',
    learningObjectives: [
      'Menilai risiko gratifikasi dan benturan kepentingan (conflict of interest)',
      'Melakukan due diligence kepatuhan mitra vendor pengadaan',
      'Menjalankan audit kepatuhan internal sesuai kode etik korporasi'
    ],
    sksHours: 7,
    colorTheme: 'rose',
    certificateUrl: '/assets/images/certificate_sample_diklat.svg',
    certificateFileName: 'Sertifikat_Auditor_ISO37001_Anti_Bribery.svg',
    posterUrl: '/assets/images/poster_sample_diklat.svg',
    posterFileName: 'Poster_Audit_Internal_ISO37001.svg',
    participants: [
      {
        id: 'p-701',
        name: 'M. Danang Prasetyo, S.E., Ak.',
        nip: '19870821 201201 1 005',
        unitKerja: 'Data Analyst',
        jabatan: 'Lead Compliance Officer & SMAP Investigator',
        email: 'danang.prasetyo@coorporate.co.id',
        phone: '+62 811-9988-1144',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-10'
      },
      {
        id: 'p-702',
        name: 'Safira Amanda, S.H., LL.M.',
        nip: '19901115 201502 2 001',
        unitKerja: 'Medical Record',
        jabatan: 'Head of Corporate Governance & Legal Compliance',
        email: 'safira.amanda@coorporate.co.id',
        phone: '+62 812-3344-9988',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-11'
      },
      {
        id: 'p-703',
        name: 'Heri Susanto, S.E.',
        nip: '19860410 201001 1 003',
        unitKerja: 'Asset & Procurement',
        jabatan: 'Senior Vendor Procurement Specialist',
        email: 'heri.susanto@coorporate.co.id',
        phone: '+62 813-7766-5544',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-13'
      },
      {
        id: 'p-704',
        name: 'Endang Sulistyowati, S.E., Ak.',
        nip: '19850912 200902 2 003',
        unitKerja: 'Finance & Accounting',
        jabatan: 'Auditor Keuangan Internal',
        email: 'endang.s@coorporate.co.id',
        phone: '+62 856-1199-2288',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-14'
      }
    ]
  },
  {
    id: 'trn-008',
    code: 'TRN-DEV-2026-07',
    title: 'Cloud Architecture & DevOps CI/CD Pipeline Automation',
    category: 'Teknologi & Digital',
    scope: 'Eksternal',
    date: '2026-11-12',
    startTime: '08:30',
    endTime: '16:30',
    locationType: 'Online (Zoom)',
    venue: 'Virtual Cloud Academy Lab',
    instructor: {
      name: 'Rizaldi Ardiansyah, S.Kom., Cloud Architect',
      title: 'Principal Cloud Infrastructure Engineer',
      organization: 'Cloud Native Enterprise Indonesia'
    },
    capacity: 30,
    status: 'Terjadwal',
    description: 'Implementasi containerization Kubernetes, Terraform Infrastructure as Code (IaC), zero-downtime deployment, dan monitoring observabilitas sistem skala enterprise.',
    learningObjectives: [
      'Membangun pipeline CI/CD otomatis dengan GitHub Actions & GitLab',
      'Konfigurasi cluster Kubernetes multi-zona dengan auto-scaling',
      'Mengurangi waktu recovery sistem (MTTR) di bawah 15 menit'
    ],
    sksHours: 8,
    colorTheme: 'cyan',
    certificateUrl: '/assets/images/certificate_sample_diklat.svg',
    certificateFileName: 'Sertifikat_Cloud_Architect_Kubernetes.svg',
    posterUrl: '/assets/images/poster_sample_diklat.svg',
    posterFileName: 'Poster_Workshop_Cloud_DevOps_CI_CD.svg',
    participants: [
      {
        id: 'p-801',
        name: 'Aldo Pratama, S.Kom.',
        nip: '19940217 201801 1 002',
        unitKerja: 'Information Technology',
        jabatan: 'Cloud Site Reliability Engineer',
        email: 'aldo.pratama@coorporate.co.id',
        phone: '+62 812-9911-3344',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-18'
      },
      {
        id: 'p-802',
        name: 'Gita Permatasari, S.T.',
        nip: '19950829 201902 2 001',
        unitKerja: 'Information Technology',
        jabatan: 'Backend Software Architect',
        email: 'gita.permatasari@coorporate.co.id',
        phone: '+62 813-7722-1100',
        statusKehadiran: 'Konfirmasi',
        registeredAt: '2026-10-19'
      },
      {
        id: 'p-803',
        name: 'Bagus Setyawan, S.Kom.',
        nip: '19921104 201601 1 005',
        unitKerja: 'Operating Theater',
        jabatan: 'Integrator IT Sistem Gudang Terpusat',
        email: 'bagus.setyawan@coorporate.co.id',
        phone: '+62 857-8899-2233',
        statusKehadiran: 'Terdaftar',
        registeredAt: '2026-10-20'
      }
    ]
  }
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  'Teknologi & Digital': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]'
  },
  'Kepemimpinan & Manajerial': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    glow: 'shadow-[0_0_12px_rgba(139,92,246,0.3)]'
  },
  'K3 & Lingkungan': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]'
  },
  'Keuangan & Audit': {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    glow: 'shadow-[0_0_12px_rgba(14,165,233,0.3)]'
  },
  'Operasional & Layanan': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]'
  },
  'Tata Kelola & Kepatuhan': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]'
  }
};
