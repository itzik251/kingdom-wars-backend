"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LeaderboardScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const gameStore_1 = require("../store/gameStore");
const useT_1 = require("../i18n/useT");
const RANK_MEDALS = ['🥇', '🥈', '🥉'];
function LeaderboardScreen() {
    const { kingdom } = (0, gameStore_1.useGameStore)();
    const [entries, setEntries] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [myRank, setMyRank] = (0, react_1.useState)(null);
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => { load(); }, []);
    async function load() {
        setLoading(true);
        try {
            const data = await client_1.api.get('/leaderboard');
            setEntries(data);
            if (kingdom) {
                const myEntry = data.findIndex((e) => e.kingdomName === kingdom.name);
                if (myEntry !== -1)
                    setMyRank(myEntry + 1);
            }
        }
        finally {
            setLoading(false);
        }
    }
    const isMe = (e) => e.kingdomName === kingdom?.name;
    return (<div style={{ background: 'linear-gradient(180deg,#0a0a1a 0%,#0d1529 100%)', minHeight: '100vh', paddingBottom: 130 }}>

      
      <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(244,208,63,0.2)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f4d03f', textShadow: '0 0 10px rgba(244,208,63,0.4)' }}>{t('leaderboard_title')}</div>
        {myRank && <div style={{ fontSize: 12, color: '#a0845a', marginTop: 3 }}>{t('your_rank', { n: myRank })}</div>}
      </div>

      
      {!loading && entries.length >= 3 && (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, padding: '20px 16px 10px', direction: 'ltr' }}>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🥈</div>
            <div style={{
                background: 'linear-gradient(180deg,#888,#555)', borderRadius: '8px 8px 0 0',
                padding: '16px 8px 10px', minHeight: 80,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{entries[1]?.kingdomName?.substring(0, 10)}</div>
              <div style={{ fontSize: 12, color: '#ddd', marginTop: 4 }}>🏆 {(0, format_1.fmt)(entries[1]?.score)}</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🥇</div>
            <div style={{
                background: 'linear-gradient(180deg,#b8860b,#8b6914)', borderRadius: '8px 8px 0 0',
                padding: '24px 8px 10px', minHeight: 110,
                boxShadow: '0 0 20px rgba(244,208,63,0.3)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f4d03f' }}>{entries[0]?.kingdomName?.substring(0, 10)}</div>
              <div style={{ fontSize: 13, color: '#ffd700', marginTop: 4, fontWeight: 700 }}>🏆 {(0, format_1.fmt)(entries[0]?.score)}</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🥉</div>
            <div style={{
                background: 'linear-gradient(180deg,#cd7f32,#8b4513)', borderRadius: '8px 8px 0 0',
                padding: '10px 8px', minHeight: 60,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{entries[2]?.kingdomName?.substring(0, 10)}</div>
              <div style={{ fontSize: 12, color: '#ddd', marginTop: 4 }}>🏆 {(0, format_1.fmt)(entries[2]?.score)}</div>
            </div>
          </div>
        </div>)}

      
      <div style={{ padding: '0 12px', marginTop: 8 }}>
        {loading ? (<div style={{ textAlign: 'center', padding: 60, color: '#a0845a' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            {t('loading')}
          </div>) : entries.length === 0 ? (<div style={{ textAlign: 'center', padding: 60, color: '#a0845a' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
            {t('no_data')}
          </div>) : (entries.map((e, i) => (<div key={i} style={{
                background: isMe(e)
                    ? 'linear-gradient(135deg,rgba(244,208,63,0.15),rgba(184,134,11,0.1))'
                    : 'linear-gradient(135deg,rgba(0,0,0,0.4),rgba(20,10,0,0.5))',
                border: isMe(e) ? '1px solid rgba(244,208,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '11px 14px', marginBottom: 7,
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: isMe(e) ? '0 0 12px rgba(244,208,63,0.15)' : 'none',
            }}>
              <div style={{ fontSize: i < 3 ? 22 : 14, fontWeight: 700, color: '#a0845a', minWidth: 28, textAlign: 'center' }}>
                {i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: isMe(e) ? '#f4d03f' : '#fff' }}>
                  {e.kingdomName} {isMe(e) && '👑'}
                </div>
                {e.username && (<div style={{ fontSize: 11, color: '#a0845a', marginTop: 1 }}>@{e.username}</div>)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f4d03f' }}>🏆 {(0, format_1.fmt)(e.score)}</div>
              </div>
            </div>)))}
      </div>

      
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <button className="btn btn-ghost" onClick={load} style={{ fontSize: 13 }}>{t('refresh')}</button>
      </div>
    </div>);
}
//# sourceMappingURL=LeaderboardScreen.js.map