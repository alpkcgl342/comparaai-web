// Faz 4 — kullanıcının teknik seviye tercihi. Gerçek kullanıcı girişi
// (Supabase Auth) henüz yok, bu yüzden UserProfile.expertiseLevel yerine
// tarayıcı localStorage kullanılıyor; Faz 5'te gerçek hesaplara taşınabilir.
export type ExpertiseLevel = "basit" | "normal" | "teknik" | "uzman";

export const EXPERTISE_LEVELS: { value: ExpertiseLevel; label: string }[] = [
  { value: "basit", label: "Başlangıç" },
  { value: "normal", label: "Normal" },
  { value: "teknik", label: "Teknik" },
  { value: "uzman", label: "Uzman" },
];

const STORAGE_KEY = "comparaai_expertise_level";

export function getStoredExpertiseLevel(): ExpertiseLevel {
  if (typeof window === "undefined") return "normal";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "basit" || value === "normal" || value === "teknik" || value === "uzman") {
      return value;
    }
  } catch {
    // localStorage erişilemezse (gizli sekme vb.) sessizce varsayılana düş.
  }
  return "normal";
}

export function setStoredExpertiseLevel(level: ExpertiseLevel) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // yok sayılabilir
  }
}
