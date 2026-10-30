import React, { useState } from 'react';
import { X, UserPlus, Building2, User, Briefcase, Hash, Save, CheckCircle2 } from 'lucide-react';
import { EmployeeItem } from '../types/employee';
import { getAllKnownUnits, saveCustomUnit } from '../utils/unitManager';
import { saveEmployee, updateEmployee } from '../utils/employeeManager';

interface AddEditEmployeeModalProps {
  employee?: EmployeeItem | null;
  onClose: () => void;
  onSaved: (emp: EmployeeItem) => void;
}

export const AddEditEmployeeModal: React.FC<AddEditEmployeeModalProps> = ({
  employee,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(employee);
  const [name, setName] = useState(employee?.name || '');
  const [idKaryawan, setIdKaryawan] = useState(employee?.idKaryawan || '');
  const [jabatan, setJabatan] = useState(employee?.jabatan || '');
  const [unitKerja, setUnitKerja] = useState(employee?.unitKerja || getAllKnownUnits()[0] || 'Inpatient');
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama lengkap karyawan wajib diisi.');
      return;
    }

    const finalUnit = isCustomUnit && customUnit.trim() ? customUnit.trim() : unitKerja;
    if (isCustomUnit && customUnit.trim()) {
      saveCustomUnit(finalUnit);
    }

    const finalIdKaryawan = idKaryawan.trim() || `199${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    if (isEditing && employee) {
      const updated: Partial<EmployeeItem> = {
        name: name.trim(),
        idKaryawan: finalIdKaryawan,
        jabatan: jabatan.trim() || 'Staff Pelaksana',
        unitKerja: finalUnit
      };
      updateEmployee(employee.id, updated);
      onSaved({ ...employee, ...updated } as EmployeeItem);
    } else {
      const saved = saveEmployee({
        name: name.trim(),
        idKaryawan: finalIdKaryawan,
        jabatan: jabatan.trim() || 'Staff Pelaksana',
        unitKerja: finalUnit
      });
      onSaved(saved);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative aero-border-gradient">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Direktori Perawat & Bidan RSIA Az Zahra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Lengkap Karyawan (Perawat / Bidan / Tenaga Klinis) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ns. Siti Rahmawati, S.Kep. atau Bdn. Nurhasanah"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NIK (Nomor Induk Karyawan)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={idKaryawan}
                  onChange={(e) => setIdKaryawan(e.target.value)}
                  placeholder="19920315 201601 2 001"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jabatan / Posisi
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Senior Clinical Preceptor / Bidan Koordinator"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Unit Kerja Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Unit Kerja *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomUnit(!isCustomUnit)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                {isCustomUnit ? 'Pilih dari Daftar Unit' : '+ Masukkan Unit Baru'}
              </button>
            </div>
            {isCustomUnit ? (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Tulis nama unit kerja baru..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 appearance-none cursor-pointer"
                >
                  {getAllKnownUnits().map((unit) => (
                    <option key={unit} value={unit} className="bg-slate-900 text-white">
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Karyawan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
