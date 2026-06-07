"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LanguageSwitcher;
const react_1 = require("react");
const translations_1 = require("../i18n/translations");
const useT_1 = require("../i18n/useT");
function LanguageSwitcher() {
    const { lang, setLang } = (0, useT_1.useLangStore)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const [pos, setPos] = (0, react_1.useState)({ top: 0, right: 0 });
    const btnRef = (0, react_1.useRef)(null);
    const current = translations_1.LANGUAGES.find(l => l.code === lang);
    (0, react_1.useEffect)(() => {
        if (open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({
                top: r.bottom + 4,
                right: window.innerWidth - r.right,
            });
        }
    }, [open]);
    return (<div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '5px 10px',
            color: '#f4d03f',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontWeight: 700,
        }}>
        {current.flag} {current.code.toUpperCase()}
      </button>

      {open && (<>
          
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)}/>
          
          <div style={{
                position: 'fixed',
                top: pos.top,
                right: pos.right,
                zIndex: 9999,
                background: '#1a0a00',
                border: '1px solid rgba(244,208,63,0.3)',
                borderRadius: 12,
                overflow: 'hidden',
                minWidth: 160,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
            {translations_1.LANGUAGES.map(l => (<button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    background: l.code === lang ? 'rgba(244,208,63,0.15)' : 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: l.code === lang ? '#f4d03f' : '#c8a875',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: l.code === lang ? 800 : 400,
                    direction: 'ltr',
                }}>
                <span style={{ fontSize: 18 }}>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span style={{ marginLeft: 'auto', color: '#f4d03f' }}>✓</span>}
              </button>))}
          </div>
        </>)}
    </div>);
}
//# sourceMappingURL=LanguageSwitcher.js.map