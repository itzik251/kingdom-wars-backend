"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OnboardingModal;
const react_1 = require("react");
const client_1 = require("../api/client");
const KINGDOM_FLAGS = ['🏰', '⚔️', '🛡️', '🦁', '🐉', '🌟', '💎', '🔥', '❄️', '🌙', '⚡', '🌊', '🗡️', '👑', '🏯'];
const LABELS = {
    he: { title: '🏰 ברוך הבא, מלך!', sub: 'בחר שם ודגל לממלכתך', namePh: 'שם הממלכה...', btn: '⚔️ התחל לשחק!', tooShort: 'שם קצר מדי (מינימום 3)', tooLong: 'שם ארוך מדי (מקסימום 20)' },
    en: { title: '🏰 Welcome, King!', sub: 'Choose a name and flag for your kingdom', namePh: 'Kingdom name...', btn: '⚔️ Start Playing!', tooShort: 'Name too short (min 3)', tooLong: 'Name too long (max 20)' },
    ru: { title: '🏰 Добро пожаловать, Король!', sub: 'Выберите имя и флаг королевства', namePh: 'Название королевства...', btn: '⚔️ Начать игру!', tooShort: 'Слишком короткое (мин 3)', tooLong: 'Слишком длинное (макс 20)' },
    es: { title: '🏰 ¡Bienvenido, Rey!', sub: 'Elige nombre y bandera para tu reino', namePh: 'Nombre del reino...', btn: '⚔️ ¡Empezar!', tooShort: 'Nombre muy corto (mín 3)', tooLong: 'Nombre muy largo (máx 20)' },
    fr: { title: '🏰 Bienvenue, Roi!', sub: 'Choisissez un nom et un drapeau', namePh: 'Nom du royaume...', btn: '⚔️ Commencer!', tooShort: 'Nom trop court (min 3)', tooLong: 'Nom trop long (max 20)' },
    de: { title: '🏰 Willkommen, König!', sub: 'Wähle Namen und Flagge', namePh: 'Königreichsname...', btn: '⚔️ Spielen!', tooShort: 'Name zu kurz (min 3)', tooLong: 'Name zu lang (max 20)' },
    pt: { title: '🏰 Bem-vindo, Rei!', sub: 'Escolha nome e bandeira', namePh: 'Nome do reino...', btn: '⚔️ Começar!', tooShort: 'Nome muito curto (mín 3)', tooLong: 'Nome muito longo (máx 20)' },
    ar: { title: '🏰 مرحباً أيها الملك!', sub: 'اختر اسماً وعلماً لمملكتك', namePh: 'اسم المملكة...', btn: '⚔️ ابدأ اللعب!', tooShort: 'الاسم قصير جداً (3 أحرف)', tooLong: 'الاسم طويل جداً (20 حرف)' },
};
function OnboardingModal({ defaultName, onDone }) {
    const lang = localStorage.getItem('kw_lang') || 'en';
    const lbl = LABELS[lang] || LABELS['en'];
    const [name, setName] = (0, react_1.useState)(defaultName);
    const [flag, setFlag] = (0, react_1.useState)('🏰');
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    async function submit() {
        const trimmed = name.trim();
        if (trimmed.length < 3) {
            setError(lbl.tooShort);
            return;
        }
        if (trimmed.length > 20) {
            setError(lbl.tooLong);
            return;
        }
        setLoading(true);
        try {
            await client_1.api.post('/kingdom/rename', { name: `${flag} ${trimmed}` });
            onDone();
        }
        catch {
            setLoading(false);
        }
    }
    return (<div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}>
      <div style={{
            width: '100%', maxWidth: 420,
            background: 'linear-gradient(180deg,#1a0a00,#0d1200)',
            border: '1px solid rgba(244,208,63,0.4)',
            borderRadius: 24, padding: 28,
            boxShadow: '0 0 60px rgba(244,208,63,0.1)',
        }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52 }}>{flag}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f4d03f', marginTop: 8 }}>{lbl.title}</div>
          <div style={{ fontSize: 13, color: '#a0845a', marginTop: 4 }}>{lbl.sub}</div>
        </div>

        
        <input value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder={lbl.namePh} maxLength={20} style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${error ? '#e74c3c' : 'rgba(244,208,63,0.3)'}`,
            color: '#f4d03f', fontSize: 16, fontWeight: 700,
            outline: 'none', boxSizing: 'border-box', marginBottom: 6,
            textAlign: 'center',
        }} onKeyDown={e => e.key === 'Enter' && submit()}/>
        {error && <div style={{ color: '#e74c3c', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{error}</div>}

        
        <div style={{ fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 10, marginTop: 4 }}>
          {lang === 'he' ? 'בחר דגל:' : lang === 'ru' ? 'Выбери флаг:' : 'Choose flag:'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {KINGDOM_FLAGS.map(f => (<button key={f} onClick={() => setFlag(f)} style={{
                width: 44, height: 44, borderRadius: 10, fontSize: 22,
                background: flag === f ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${flag === f ? '#f4d03f' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                transform: flag === f ? 'scale(1.15)' : 'scale(1)',
            }}>{f}</button>))}
        </div>

        <button onClick={submit} disabled={loading || name.trim().length < 3} style={{
            width: '100%', padding: '15px',
            background: name.trim().length >= 3
                ? 'linear-gradient(135deg,#f39c12,#f4d03f)'
                : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: 12,
            color: name.trim().length >= 3 ? '#000' : '#555',
            fontSize: 16, fontWeight: 900, cursor: name.trim().length >= 3 ? 'pointer' : 'not-allowed',
            boxShadow: name.trim().length >= 3 ? '0 4px 20px rgba(244,208,63,0.4)' : 'none',
        }}>
          {loading ? '...' : lbl.btn}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=OnboardingModal.js.map