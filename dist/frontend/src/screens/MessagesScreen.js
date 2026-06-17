"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessagesScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const useT_1 = require("../i18n/useT");
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)
        return `${diff}ש`;
    if (diff < 3600)
        return `${Math.floor(diff / 60)}ד`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)}ש'`;
    return `${Math.floor(diff / 86400)}י`;
}
function MessagesScreen() {
    const t = (0, useT_1.useT)();
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [clearing, setClearing] = (0, react_1.useState)(false);
    const load = async () => {
        setLoading(true);
        try {
            const data = await client_1.api.get('/kingdom/messages');
            setMessages(data);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => { load(); }, []);
    const clear = async () => {
        setClearing(true);
        try {
            await client_1.api.delete('/kingdom/messages');
            setMessages([]);
        }
        finally {
            setClearing(false);
        }
    };
    return (<div style={{ padding: '16px 14px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f4d03f' }}>📬 {t('messages_title')}</div>
        {messages.length > 0 && (<button onClick={clear} disabled={clearing} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer' }}>
            {clearing ? '...' : t('messages_clear')}
          </button>)}
      </div>

      {loading ? (<div style={{ textAlign: 'center', color: '#555', paddingTop: 60 }}>...</div>) : messages.length === 0 ? (<div style={{ textAlign: 'center', color: '#555', paddingTop: 60, fontSize: 14 }}>
          {t('messages_empty')}
        </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(msg => (<div key={msg.id} style={{
                    background: msg.read ? 'rgba(0,0,0,0.3)' : 'rgba(244,208,63,0.06)',
                    border: `1px solid ${msg.read ? 'rgba(255,255,255,0.07)' : 'rgba(244,208,63,0.2)'}`,
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 10,
                }}>
              <div style={{ fontSize: 13, color: msg.read ? '#888' : '#e8d48b', lineHeight: 1.5, flex: 1 }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', marginTop: 2 }}>
                {timeAgo(msg.createdAt)}
              </div>
            </div>))}
        </div>)}
    </div>);
}
//# sourceMappingURL=MessagesScreen.js.map