"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TermsModal;
const react_1 = require("react");
const client_1 = require("../api/client");
const useT_1 = require("../i18n/useT");
const TERMS = {
    he: `📜 תנאי שימוש — Kingdom Wars

1. 🎮 המשחק מיועד לשחקנים מגיל 13 ומעלה.

2. 🚫 אסור בתכלית האיסור:
   • שימוש בבוטים, סקריפטים, או כל אוטומציה
   • יצירת חשבונות מזויפים לניצול מערכת ההפניות
   • ניסיון לפרוץ, לשבש, או לנצל באגים במשחק
   • שיתוף, מכירה, או העברת חשבון

3. 💎 מטבעות ופרסים:
   • ה-Gems וה-USDT שנצברים הם רכוש וירטואלי
   • משיכת USDT כפופה לאימות ולתנאי המינימום
   • Kingdom Wars שומרת לעצמה הזכות לבטל פרסים שנצברו בדרכים לא הוגנות

4. 🔒 פרטיות:
   • המשחק ניגש לנתוני Telegram הבסיסיים בלבד (שם, מזהה)
   • לא נשמרים נתונים רגישים
   • הנתונים משמשים לניהול המשחק בלבד

5. ⚖️ אכיפה:
   • הפרת התנאים עלולה לגרום לחסימת חשבון ללא החזר
   • Kingdom Wars שומרת הזכות לסגור חשבונות חשודים

על ידי לחיצה על "אני מסכים/ה" אתה/את מאשר/ת שקראת והבנת את תנאי השימוש.`,
    en: `📜 Terms of Service — Kingdom Wars

1. 🎮 The game is intended for players aged 13 and above.

2. 🚫 Strictly prohibited:
   • Using bots, scripts, or any automation
   • Creating fake accounts to exploit the referral system
   • Attempting to hack, disrupt, or exploit game bugs
   • Sharing, selling, or transferring accounts

3. 💎 Coins & Rewards:
   • Gems and USDT earned are virtual assets
   • USDT withdrawals are subject to verification and minimum requirements
   • Kingdom Wars reserves the right to cancel rewards obtained unfairly

4. 🔒 Privacy:
   • The game accesses only basic Telegram data (name, ID)
   • No sensitive data is stored
   • Data is used solely for game management

5. ⚖️ Enforcement:
   • Violations may result in account ban without refund
   • Kingdom Wars reserves the right to close suspicious accounts

By clicking "I Agree" you confirm you have read and understood these Terms of Service.`,
    ru: `📜 Условия использования — Kingdom Wars

1. 🎮 Игра предназначена для игроков от 13 лет.

2. 🚫 Строго запрещено:
   • Использование ботов, скриптов или автоматизации
   • Создание фиктивных аккаунтов для эксплуатации реферальной системы
   • Попытки взломать, нарушить работу игры или использовать баги
   • Передача, продажа или обмен аккаунтами

3. 💎 Монеты и награды:
   • Gems и USDT — виртуальные активы
   • Вывод USDT требует верификации
   • Kingdom Wars вправе аннулировать несправедливо полученные награды

4. 🔒 Конфиденциальность:
   • Игра использует только базовые данные Telegram (имя, ID)
   • Конфиденциальные данные не хранятся

5. ⚖️ Соблюдение правил:
   • Нарушение правил может привести к блокировке без возврата средств

Нажимая "Принимаю", вы подтверждаете, что прочитали условия.`,
};
function getTermsText(lang) {
    return TERMS[lang] || TERMS['en'];
}
function TermsModal({ onAccepted }) {
    const t = (0, useT_1.useT)();
    const [scrolled, setScrolled] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const lang = localStorage.getItem('kw_lang') || 'en';
    async function accept() {
        setLoading(true);
        try {
            await client_1.api.post('/auth/accept-terms');
            onAccepted();
        }
        catch {
            setLoading(false);
        }
    }
    const LABELS = {
        he: { title: '📜 תנאי שימוש', agree: '✅ אני מסכים/ה ומאשר/ת', scroll: '↕️ גלול למטה לקרוא הכל' },
        en: { title: '📜 Terms of Service', agree: '✅ I Agree & Accept', scroll: '↕️ Scroll down to read all' },
        ru: { title: '📜 Условия использования', agree: '✅ Принимаю', scroll: '↕️ Прокрутите вниз' },
        es: { title: '📜 Términos de uso', agree: '✅ Acepto', scroll: '↕️ Desplácese hacia abajo' },
        fr: { title: '📜 Conditions d\'utilisation', agree: '✅ J\'accepte', scroll: '↕️ Faites défiler vers le bas' },
        de: { title: '📜 Nutzungsbedingungen', agree: '✅ Ich stimme zu', scroll: '↕️ Nach unten scrollen' },
        pt: { title: '📜 Termos de uso', agree: '✅ Aceito', scroll: '↕️ Role para baixo' },
        ar: { title: '📜 شروط الاستخدام', agree: '✅ أوافق وأقبل', scroll: '↕️ مرر للأسفل للقراءة' },
    };
    const lbl = LABELS[lang] || LABELS['en'];
    return (<div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }}>
      <div style={{
            width: '100%', maxWidth: 480,
            background: 'linear-gradient(180deg,#0d1f0a,#060e04)',
            border: '1px solid rgba(244,208,63,0.3)',
            borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh',
        }}>
        
        <div style={{
            padding: '20px 20px 12px',
            background: 'linear-gradient(135deg,rgba(244,208,63,0.1),rgba(39,174,96,0.05))',
            borderBottom: '1px solid rgba(244,208,63,0.15)',
            textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚔️</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#f4d03f' }}>Kingdom Wars</div>
          <div style={{ fontSize: 14, color: '#a0845a', marginTop: 4 }}>{lbl.title}</div>
        </div>

        
        <div onScroll={(e) => {
            const el = e.currentTarget;
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
            if (nearBottom)
                setScrolled(true);
        }} style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            fontSize: 13, lineHeight: 1.7, color: '#d4b896',
            whiteSpace: 'pre-wrap',
        }}>
          {getTermsText(lang)}
        </div>

        
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!scrolled && (<div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginBottom: 8, animation: 'pulse 2s infinite' }}>
              {lbl.scroll}
            </div>)}
          <button onClick={accept} disabled={!scrolled || loading} style={{
            width: '100%', padding: '14px',
            background: scrolled
                ? 'linear-gradient(135deg,#27ae60,#2ecc71)'
                : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: 12,
            color: scrolled ? 'white' : '#555',
            fontSize: 15, fontWeight: 800,
            cursor: scrolled ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            boxShadow: scrolled ? '0 4px 20px rgba(39,174,96,0.4)' : 'none',
        }}>
            {loading ? '...' : lbl.agree}
          </button>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#444', marginTop: 8 }}>
            Kingdom Wars © 2026
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=TermsModal.js.map