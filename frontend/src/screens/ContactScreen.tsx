import { useState } from 'react';
import { useT, useLangStore } from '../i18n/useT';
import { LANGUAGES } from '../i18n/translations';
import { useGameStore } from '../store/gameStore';
import { api } from '../api/client';

export default function ContactScreen() {
  const t = useT();
  const { lang } = useLangStore();
  const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? true;
  const kingdom = useGameStore(s => s.kingdom);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function send() {
    if (!subject.trim() || !message.trim()) return;
    setStatus('sending');
    try {
      await api.post('/kingdom/contact', { subject, message });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  const dir = isRtl ? 'rtl' : 'ltr';

  return (
    <div className="screen" dir={dir}>
      <div className="screen-title">{t('contact_title')}</div>

      {status === 'sent' ? (
        <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', fontSize: 14, color: '#27ae60', lineHeight: 1.8 }}>
          {t('contact_sent')}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>{t('contact_subject')}</div>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('contact_placeholder_subject')}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,208,63,0.2)',
                borderRadius: 10, padding: '10px 12px', color: '#e8d48b',
                fontSize: 14, outline: 'none', direction: dir,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>{t('contact_message')}</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('contact_placeholder_msg')}
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(244,208,63,0.2)',
                borderRadius: 10, padding: '10px 12px', color: '#e8d48b',
                fontSize: 14, outline: 'none', resize: 'vertical', direction: dir,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {status === 'error' && (
            <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 10 }}>{t('contact_error')}</div>
          )}

          <button
            className="btn btn-gold"
            style={{ width: '100%', fontSize: 14, padding: '12px' }}
            disabled={status === 'sending' || !subject.trim() || !message.trim()}
            onClick={send}
          >
            {status === 'sending' ? '...' : t('contact_send')}
          </button>
        </>
      )}
    </div>
  );
}
