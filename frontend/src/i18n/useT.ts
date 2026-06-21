import { create } from 'zustand';
import { Lang, LANGUAGES, TRANSLATIONS } from './translations';

const STORAGE_KEY = 'kw_lang';

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && LANGUAGES.find(l => l.code === saved)) return saved;
  const browser = navigator.language.split('-')[0];
  const match = LANGUAGES.find(l => l.code === browser);
  return match ? match.code : 'en';
}

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: detectLang(),
  setLang: (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    set({ lang });
    // Sync to backend so push notifications use the right language
    const token = localStorage.getItem('kw_token');
    if (token) {
      fetch('/api/auth/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ language: lang }),
      }).catch(() => {});
    }
  },
}));

export function useT() {
  const lang = useLangStore(s => s.lang);
  const dict = TRANSLATIONS[lang] as Record<string, string>;
  const fallback = TRANSLATIONS['he'] as Record<string, string>;
  return (key: string, vars?: Record<string, string | number>): string => {
    let str = dict[key] ?? fallback[key] ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  };
}
