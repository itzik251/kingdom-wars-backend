"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KingdomProfileSheet;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
const sheetWrap = {
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'flex-end',
};
const sheetInner = {
    width: '100%',
    maxHeight: '82vh',
    overflowY: 'auto',
    background: 'linear-gradient(180deg,#1a0a00 0%,#110700 100%)',
    borderRadius: '20px 20px 0 0',
    padding: '20px 16px 110px',
    animation: 'slideUp 0.25s ease-out',
};
function KingdomProfileSheet({ kingdomId, onClose, onAttack, attacking }) {
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => {
        let alive = true;
        setLoading(true);
        client_1.api.get(`/combat/profile/${kingdomId}`)
            .then((p) => { if (alive)
            setProfile(p); })
            .catch(() => { if (alive)
            setError(true); })
            .finally(() => { if (alive)
            setLoading(false); });
        return () => { alive = false; };
    }, [kingdomId]);
    if (loading) {
        return (<div style={sheetWrap} onClick={onClose}>
        <div style={{ ...sheetInner, textAlign: 'center', padding: 40, color: '#a0845a' }}>{t('loading_intel')}</div>
      </div>);
    }
    if (error || !profile) {
        return (<div style={sheetWrap} onClick={onClose}>
        <div style={{ ...sheetInner, textAlign: 'center', padding: 40, color: '#e74c3c' }}>
          {t('failed_load_kingdom')}
        </div>
      </div>);
    }
    const wcColor = profile.winChance >= 60 ? '#27ae60' : profile.winChance >= 40 ? '#f39c12' : '#e74c3c';
    const wcBar = profile.winChance >= 60
        ? 'linear-gradient(90deg,#27ae60,#2ecc71)'
        : profile.winChance >= 40
            ? 'linear-gradient(90deg,#f39c12,#e67e22)'
            : 'linear-gradient(90deg,#c0392b,#e74c3c)';
    return (<div style={sheetWrap} onClick={onClose}>
      <div style={sheetInner} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e74c3c' }}>🏰 {profile.name}</div>
            <div style={{ fontSize: 12, color: '#a0845a' }}>@{profile.username || '?'} · 🏆 {(0, format_1.fmt)(profile.score)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {profile.isShielded && (<div style={{ background: 'rgba(52,152,219,0.15)', border: '1px solid #3498db', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#3498db', fontSize: 13, textAlign: 'center' }}>
            {t('kingdom_protected')}
          </div>)}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0845a', marginBottom: 6 }}>
            <span>⚔️ {t('your_power')}: {(0, format_1.fmt)(profile.myAttackPower)}</span>
            <span>🛡️ {t('defender_power')}: {(0, format_1.fmt)(profile.defPower)}</span>
          </div>
          <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${profile.winChance}%`, background: wcBar, borderRadius: 6, transition: 'width 0.5s' }}/>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, marginTop: 6, color: wcColor }}>
            {t('win_chance', { n: profile.winChance })}
          </div>
        </div>

        <div style={{ background: 'rgba(244,208,63,0.08)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 8 }}>{t('potential_loot')}</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>💰</div><div style={{ fontSize: 14, fontWeight: 700, color: '#f4d03f' }}>{(0, format_1.fmt)(profile.lootable.gold)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>🪵</div><div style={{ fontSize: 14, fontWeight: 700, color: '#a0682a' }}>{(0, format_1.fmt)(profile.lootable.wood)}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18 }}>🪨</div><div style={{ fontSize: 14, fontWeight: 700, color: '#aaa' }}>{(0, format_1.fmt)(profile.lootable.stone)}</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: t('army_size'), value: (0, format_1.fmt)(profile.armySize), icon: '🪖' },
            { label: t('wall_defense'), value: `Lv.${profile.wallLevel}`, icon: '🧱' },
            { label: t('march_time'), value: `${profile.marchSeconds}s`, icon: '⏱️' },
        ].map(({ label, value, icon }) => (<div key={label} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 9, color: '#a0845a' }}>{label}</div>
            </div>))}
        </div>

        <button onClick={() => !profile.isShielded && !attacking && onAttack(profile)} disabled={profile.isShielded || attacking} style={{
            width: '100%', padding: '14px',
            background: profile.isShielded ? '#333' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
            border: 'none', borderRadius: 12, color: 'white',
            fontSize: 16, fontWeight: 800,
            cursor: profile.isShielded || attacking ? 'not-allowed' : 'pointer',
            boxShadow: profile.isShielded ? 'none' : '0 4px 20px rgba(231,76,60,0.5)',
            letterSpacing: '0.5px', opacity: attacking ? 0.7 : 1,
        }}>
          {profile.isShielded
            ? t('protected_btn')
            : attacking
                ? t('attacking_label')
                : t('attack_btn_time', { n: profile.marchSeconds })}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=KingdomProfileSheet.js.map