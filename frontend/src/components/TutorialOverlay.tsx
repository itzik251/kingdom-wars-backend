import { useState, useEffect } from 'react';
import { useT } from '../i18n/useT';

const STORAGE_KEY = 'kw_tutorial_done';

const STEPS_KEYS = [
  { icon: '🏰', titleKey: 'tut_step1_title', textKey: 'tut_step1_text' },
  { icon: '⚒️', titleKey: 'tut_step2_title', textKey: 'tut_step2_text' },
  { icon: '⚔️', titleKey: 'tut_step3_title', textKey: 'tut_step3_text' },
  { icon: '💎', titleKey: 'tut_step4_title', textKey: 'tut_step4_text' },
  { icon: '🤝', titleKey: 'tut_step5_title', textKey: 'tut_step5_text' },
];

export function useTutorial() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);
  const done = () => { localStorage.setItem(STORAGE_KEY, '1'); setShow(false); };
  return { show, done };
}

export default function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const current = STEPS_KEYS[step];
  const isLast = step === STEPS_KEYS.length - 1;

  function finish() { localStorage.setItem(STORAGE_KEY, '1'); onDone(); }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'linear-gradient(180deg,#1a0a00,#0d1200)',
        border: '1px solid rgba(244,208,63,0.35)',
        borderRadius: 24, padding: 32, textAlign: 'center',
        boxShadow: '0 0 60px rgba(244,208,63,0.08)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {STEPS_KEYS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i <= step ? '#f4d03f' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ fontSize: 64, marginBottom: 16 }}>{current.icon}</div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 900, color: '#f4d03f', marginBottom: 12 }}>
          {t(current.titleKey)}
        </div>

        {/* Text */}
        <div style={{ fontSize: 14, color: '#c4a882', lineHeight: 1.7, marginBottom: 32 }}>
          {t(current.textKey)}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '13px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#888', fontSize: 14, cursor: 'pointer',
            }}>← {t('back')}</button>
          )}
          <button onClick={isLast ? finish : () => setStep(s => s + 1)} style={{
            flex: 2, padding: '13px', borderRadius: 12,
            background: 'linear-gradient(135deg,#f39c12,#f4d03f)',
            border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(244,208,63,0.35)',
          }}>
            {isLast ? `🚀 ${t('tut_start')}` : `${t('tut_next')} →`}
          </button>
        </div>

        {/* Skip */}
        <button onClick={finish} style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          color: '#888',
          fontSize: 13,
          marginTop: 14,
          padding: '8px 20px',
          cursor: 'pointer',
          width: '100%',
        }}>{t('tut_skip')}</button>
      </div>
    </div>
  );
}
