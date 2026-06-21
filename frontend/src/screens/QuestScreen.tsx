import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { useT } from '../i18n/useT';

// Milestones are now driven entirely by the server (including dynamic USDT milestone)

function GemIcon({ size = 14 }: { size?: number }) {
  return <img src="/assets/icon_gem.png" alt="gem" style={{ width: size, height: size, verticalAlign: 'middle', marginRight: 2 }} />;
}


interface Quest {
  id: string;
  questKey: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardClaimed: boolean;
  period: string;
}

const QUEST_TKEYS: Record<string, { tkey: string; icon: string }> = {
  collect_gold_1000:  { tkey: 'quest_collect_gold',      icon: 'img:gold' },
  upgrade_building:   { tkey: 'quest_upgrade_building',  icon: '🏗️' },
  perform_attack:     { tkey: 'quest_perform_attack',    icon: '⚔️' },
  train_500_soldiers: { tkey: 'quest_train_soldiers',    icon: '🪖' },
  win_20_battles:     { tkey: 'quest_win_battles',       icon: '🏆' },
};

const QUEST_REWARDS: Record<string, number> = {
  collect_gold_1000: 10, upgrade_building: 15, perform_attack: 20,
  train_500_soldiers: 100, win_20_battles: 200,
};

export default function QuestScreen() {
  const { refresh } = useGameStore();
  const [daily, setDaily] = useState<Quest[]>([]);
  const [weekly, setWeekly] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const t = useT();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [d, w] = await Promise.all([
        api.get('/quests/daily'),
        api.get('/quests/weekly'),
      ]);
      setDaily(d); setWeekly(w);
    } finally {
      setLoading(false);
    }
  }

  async function claim(questId: string) {
    try {
      const result = await api.post(`/quests/claim/${questId}`);
      if (result?.gemsRewarded) {
        setMsg(t('gems_received', { n: result.gemsRewarded }));
        await Promise.all([load(), refresh()]);
      }
    } catch (e: any) {
      setMsg(e.response?.data?.message || t('error'));
    }
  }

  function QuestCard({ q }: { q: Quest }) {
    const meta = QUEST_TKEYS[q.questKey];
    const info = meta ? { label: t(meta.tkey), icon: meta.icon } : { label: q.questKey, icon: '📋' };
    const reward = QUEST_REWARDS[q.questKey] || 0;
    const pct = Math.min(100, (q.progress / q.target) * 100);

    return (
      <div style={{
        background: q.rewardClaimed
          ? 'rgba(0,0,0,0.2)'
          : q.completed
          ? 'linear-gradient(135deg,rgba(39,174,96,0.15),rgba(30,130,70,0.1))'
          : 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
        border: q.completed && !q.rewardClaimed
          ? '1px solid rgba(39,174,96,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 10,
        opacity: q.rewardClaimed ? 0.5 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {info.icon.startsWith('img:')
              ? <img src={`/assets/icon_${info.icon.slice(4)}.png`} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              : <span style={{ fontSize: 24 }}>{info.icon}</span>}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{info.label}</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}><GemIcon size={13} /> {reward} {t('gems')}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#a0845a', whiteSpace: 'nowrap' }}>
            {q.progress}/{q.target}
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: q.completed ? '#27ae60' : 'linear-gradient(90deg,#b8860b,#f4d03f)',
            borderRadius: 3, transition: 'width 0.4s',
          }} />
        </div>

        {q.completed && !q.rewardClaimed && (
          <button
            className="btn btn-green"
            style={{ width: '100%', fontSize: 13, padding: '8px' }}
            onClick={() => claim(q.id)}
          >
            {t('get_prize')}
          </button>
        )}
        {q.rewardClaimed && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#27ae60' }}>{t('quest_claimed')}</div>
        )}
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-title">{t('quests_title')}</div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: 'rgba(39,174,96,0.15)', border: '1px solid #27ae6044',
          color: '#27ae60', fontSize: 13, textAlign: 'center',
        }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: '#a0845a' }}>⏳ {t('loading')}</div>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#f4d03f' }}>
            {t('daily_quests')}
          </div>
          {daily.map(q => <QuestCard key={q.id} q={q} />)}

          <div style={{ fontWeight: 700, fontSize: 15, margin: '16px 0 10px', color: '#9b59b6' }}>
            {t('weekly_quests')}
          </div>
          {weekly.map(q => <QuestCard key={q.id} q={q} />)}

        </>
      )}
    </div>
  );
}
