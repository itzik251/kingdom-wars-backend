import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../i18n/translations';
import { useLangStore } from '../i18n/useT';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLangStore();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = LANGUAGES.find(l => l.code === lang)!;

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + 4,
        right: window.innerWidth - r.right,
      });
    }
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        style={{
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
        }}
      >
        {current.flag} {current.code.toUpperCase()}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown — fixed so it's never clipped by overflow/sticky parents */}
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
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
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
                }}
              >
                <span style={{ fontSize: 18 }}>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span style={{ marginLeft: 'auto', color: '#f4d03f' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
