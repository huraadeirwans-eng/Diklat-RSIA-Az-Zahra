import { Participant } from '../types/training';

/**
 * ATURAN EVALUASI KOMPETENSI (PRE-POST TEST):
 * Jika nilai tidak ada (undefined, null, NaN, atau kosong),
 * maka sistem secara otomatis akan mengisi:
 * - Nilai Pre-Test: > 75 (dalam rentang realistis 78 s/d 88)
 * - Nilai Post-Test: 100
 */

export function getDeterministicPretestScore(seed: string | number): number {
  const str = String(seed || 'pre-seed');
  const sum = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  // Selalu > 75 (menghasilkan 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, atau 88)
  return 78 + (sum % 11);
}

export function getRandomPretestScore(): number {
  // Selalu > 75 (menghasilkan integer antara 78 s/d 88)
  return Math.floor(Math.random() * 11) + 78;
}

export interface EffectiveScoresResult {
  pre: number;
  post: number;
  delta: number;
  isAutoPre: boolean;
  isAutoPost: boolean;
}

export function getEffectiveScores(participant: {
  id?: string;
  name?: string;
  nilaiPretest?: number | null;
  nilaiPosttest?: number | null;
}): EffectiveScoresResult {
  const hasValidPre =
    participant.nilaiPretest !== undefined &&
    participant.nilaiPretest !== null &&
    !isNaN(Number(participant.nilaiPretest)) &&
    Number(participant.nilaiPretest) > 0;

  const hasValidPost =
    participant.nilaiPosttest !== undefined &&
    participant.nilaiPosttest !== null &&
    !isNaN(Number(participant.nilaiPosttest)) &&
    Number(participant.nilaiPosttest) > 0;

  const pre = hasValidPre
    ? Number(participant.nilaiPretest)
    : getDeterministicPretestScore(participant.id || participant.name || 'default');

  const post = hasValidPost ? Number(participant.nilaiPosttest) : 100;
  const delta = post - pre;

  return {
    pre,
    post,
    delta,
    isAutoPre: !hasValidPre,
    isAutoPost: !hasValidPost
  };
}
