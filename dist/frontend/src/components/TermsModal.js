"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TermsModal;
const react_1 = require("react");
const client_1 = require("../api/client");
const translations_1 = require("../i18n/translations");
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
    es: `📜 Términos de Uso — Kingdom Wars

1. 🎮 El juego está destinado a jugadores mayores de 13 años.

2. 🚫 Estrictamente prohibido:
   • Usar bots, scripts o cualquier automatización
   • Crear cuentas falsas para explotar el sistema de referidos
   • Intentar hackear, interrumpir o explotar errores del juego
   • Compartir, vender o transferir cuentas

3. 💎 Monedas y recompensas:
   • Las Gems y USDT ganados son activos virtuales
   • Los retiros de USDT están sujetos a verificación y requisitos mínimos
   • Kingdom Wars se reserva el derecho de cancelar recompensas obtenidas injustamente

4. 🔒 Privacidad:
   • El juego accede solo a datos básicos de Telegram (nombre, ID)
   • No se almacenan datos sensibles
   • Los datos se usan únicamente para la gestión del juego

5. ⚖️ Aplicación:
   • Las violaciones pueden resultar en prohibición de cuenta sin reembolso
   • Kingdom Wars se reserva el derecho de cerrar cuentas sospechosas

Al hacer clic en "Acepto" confirmas que has leído y comprendido estos Términos de Uso.`,
    fr: `📜 Conditions d'utilisation — Kingdom Wars

1. 🎮 Le jeu est destiné aux joueurs âgés de 13 ans et plus.

2. 🚫 Strictement interdit :
   • Utiliser des bots, scripts ou toute automatisation
   • Créer de faux comptes pour exploiter le système de parrainage
   • Tenter de pirater, perturber ou exploiter des bugs du jeu
   • Partager, vendre ou transférer des comptes

3. 💎 Monnaies et récompenses :
   • Les Gems et USDT gagnés sont des actifs virtuels
   • Les retraits de USDT sont soumis à vérification et conditions minimales
   • Kingdom Wars se réserve le droit d'annuler les récompenses obtenues injustement

4. 🔒 Confidentialité :
   • Le jeu n'accède qu'aux données Telegram de base (nom, ID)
   • Aucune donnée sensible n'est stockée
   • Les données sont utilisées uniquement pour la gestion du jeu

5. ⚖️ Application :
   • Les violations peuvent entraîner une interdiction de compte sans remboursement
   • Kingdom Wars se réserve le droit de fermer les comptes suspects

En cliquant sur "J'accepte", vous confirmez avoir lu et compris ces Conditions d'utilisation.`,
    de: `📜 Nutzungsbedingungen — Kingdom Wars

1. 🎮 Das Spiel richtet sich an Spieler ab 13 Jahren.

2. 🚫 Strengstens verboten:
   • Verwendung von Bots, Skripten oder jeglicher Automatisierung
   • Erstellen gefälschter Konten zur Ausnutzung des Empfehlungssystems
   • Versuche, das Spiel zu hacken, zu stören oder Fehler auszunutzen
   • Teilen, Verkaufen oder Übertragen von Konten

3. 💎 Münzen und Belohnungen:
   • Verdiente Gems und USDT sind virtuelle Vermögenswerte
   • USDT-Auszahlungen unterliegen der Verifizierung und Mindestanforderungen
   • Kingdom Wars behält sich das Recht vor, unfair erworbene Belohnungen zu stornieren

4. 🔒 Datenschutz:
   • Das Spiel greift nur auf grundlegende Telegram-Daten zu (Name, ID)
   • Es werden keine sensiblen Daten gespeichert
   • Daten werden ausschließlich für die Spielverwaltung verwendet

5. ⚖️ Durchsetzung:
   • Verstöße können zur Kontosperrung ohne Erstattung führen
   • Kingdom Wars behält sich das Recht vor, verdächtige Konten zu schließen

Durch Klicken auf "Ich stimme zu" bestätigen Sie, dass Sie diese Nutzungsbedingungen gelesen und verstanden haben.`,
    pt: `📜 Termos de Uso — Kingdom Wars

1. 🎮 O jogo é destinado a jogadores com 13 anos ou mais.

2. 🚫 Estritamente proibido:
   • Usar bots, scripts ou qualquer automação
   • Criar contas falsas para explorar o sistema de referência
   • Tentar hackear, interromper ou explorar bugs do jogo
   • Compartilhar, vender ou transferir contas

3. 💎 Moedas e recompensas:
   • Gems e USDT ganhos são ativos virtuais
   • Saques de USDT estão sujeitos a verificação e requisitos mínimos
   • Kingdom Wars reserva-se o direito de cancelar recompensas obtidas injustamente

4. 🔒 Privacidade:
   • O jogo acessa apenas dados básicos do Telegram (nome, ID)
   • Nenhum dado sensível é armazenado
   • Os dados são usados exclusivamente para gerenciamento do jogo

5. ⚖️ Aplicação:
   • Violações podem resultar em banimento de conta sem reembolso
   • Kingdom Wars reserva-se o direito de fechar contas suspeitas

Ao clicar em "Aceito" você confirma que leu e compreendeu estes Termos de Uso.`,
    ar: `📜 شروط الاستخدام — Kingdom Wars

1. 🎮 اللعبة مخصصة للاعبين من عمر 13 سنة فما فوق.

2. 🚫 محظور تمامًا:
   • استخدام البوتات أو السكريبتات أو أي أتمتة
   • إنشاء حسابات وهمية لاستغلال نظام الإحالة
   • محاولة اختراق اللعبة أو تعطيلها أو استغلال الأخطاء
   • مشاركة الحسابات أو بيعها أو نقلها

3. 💎 العملات والمكافآت:
   • الجواهر والـ USDT المكتسبة هي أصول افتراضية
   • عمليات سحب USDT تخضع للتحقق والحد الأدنى
   • تحتفظ Kingdom Wars بحق إلغاء المكافآت المكتسبة بطرق غير عادلة

4. 🔒 الخصوصية:
   • تصل اللعبة فقط إلى بيانات Telegram الأساسية (الاسم، المعرّف)
   • لا يتم تخزين بيانات حساسة
   • تُستخدم البيانات فقط لإدارة اللعبة

5. ⚖️ التطبيق:
   • قد تؤدي المخالفات إلى حظر الحساب دون استرداد
   • تحتفظ Kingdom Wars بحق إغلاق الحسابات المشبوهة

بالنقر على "أوافق وأقبل" تؤكد أنك قرأت وفهمت شروط الاستخدام هذه.`,
};
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
function getTermsText(lang) {
    return TERMS[lang] || TERMS['en'];
}
function TermsModal({ onAccepted }) {
    const [scrolled, setScrolled] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [lang, setLang] = (0, react_1.useState)(localStorage.getItem('kw_lang') || 'en');
    function switchLang(newLang) {
        setLang(newLang);
        setScrolled(false);
    }
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
    const lbl = LABELS[lang] || LABELS['en'];
    const isRtl = translations_1.LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
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
            padding: '16px 20px 10px',
            background: 'linear-gradient(135deg,rgba(244,208,63,0.1),rgba(39,174,96,0.05))',
            borderBottom: '1px solid rgba(244,208,63,0.15)',
            textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⚔️</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f4d03f' }}>Kingdom Wars</div>
          <div style={{ fontSize: 13, color: '#a0845a', marginTop: 2 }}>{lbl.title}</div>

          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 10 }}>
            {translations_1.LANGUAGES.map(l => (<button key={l.code} onClick={() => switchLang(l.code)} style={{
                padding: '3px 8px', borderRadius: 8, fontSize: 11,
                background: lang === l.code ? 'rgba(244,208,63,0.3)' : 'rgba(255,255,255,0.06)',
                border: lang === l.code ? '1px solid rgba(244,208,63,0.6)' : '1px solid rgba(255,255,255,0.1)',
                color: lang === l.code ? '#f4d03f' : '#888',
                cursor: 'pointer', fontWeight: lang === l.code ? 700 : 400,
            }}>
                {l.flag} {l.code.toUpperCase()}
              </button>))}
          </div>
        </div>

        
        <div key={lang} onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 60)
                setScrolled(true);
        }} dir={isRtl ? 'rtl' : 'ltr'} style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            fontSize: 13, lineHeight: 1.7, color: '#d4b896',
            whiteSpace: 'pre-wrap',
        }}>
          {getTermsText(lang)}
        </div>

        
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!scrolled && (<div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginBottom: 8 }}>
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