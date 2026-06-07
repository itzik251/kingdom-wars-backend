"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLangStore = void 0;
exports.useT = useT;
const zustand_1 = require("zustand");
const translations_1 = require("./translations");
const STORAGE_KEY = 'kw_lang';
function detectLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations_1.LANGUAGES.find(l => l.code === saved))
        return saved;
    const browser = navigator.language.split('-')[0];
    const match = translations_1.LANGUAGES.find(l => l.code === browser);
    return match ? match.code : 'en';
}
exports.useLangStore = (0, zustand_1.create)((set) => ({
    lang: detectLang(),
    setLang: (lang) => {
        localStorage.setItem(STORAGE_KEY, lang);
        const isRtl = translations_1.LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
        document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        set({ lang });
        const token = localStorage.getItem('kw_token');
        if (token) {
            fetch('/api/auth/language', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ language: lang }),
            }).catch(() => { });
        }
    },
}));
function useT() {
    const lang = (0, exports.useLangStore)(s => s.lang);
    const dict = translations_1.TRANSLATIONS[lang];
    const fallback = translations_1.TRANSLATIONS['he'];
    return (key, vars) => {
        let str = dict[key] ?? fallback[key] ?? key;
        if (vars)
            Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
        return str;
    };
}
//# sourceMappingURL=useT.js.map