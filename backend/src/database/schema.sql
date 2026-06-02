-- Kingdom Wars – Full PostgreSQL Schema v1.0
-- Run this once to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id   BIGINT UNIQUE NOT NULL,
  username      VARCHAR(64),
  first_name    VARCHAR(64),
  avatar_url    VARCHAR(256),
  referral_code VARCHAR(16) UNIQUE NOT NULL,
  referred_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ============================================================
-- KINGDOMS
-- ============================================================
CREATE TABLE kingdoms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(64) NOT NULL DEFAULT 'My Kingdom',

  -- Resources (stored as integers, gold has decimals in memory only)
  gold            BIGINT NOT NULL DEFAULT 500,
  wood            BIGINT NOT NULL DEFAULT 300,
  stone           BIGINT NOT NULL DEFAULT 200,
  food            BIGINT NOT NULL DEFAULT 100,
  gems            INTEGER NOT NULL DEFAULT 50,

  -- Storage caps (expand with buildings)
  max_gold        BIGINT NOT NULL DEFAULT 5000,
  max_wood        BIGINT NOT NULL DEFAULT 4000,
  max_stone       BIGINT NOT NULL DEFAULT 3000,
  max_food        BIGINT NOT NULL DEFAULT 2000,

  -- Shield
  shield_until    TIMESTAMPTZ,

  -- Score (updated after each battle/upgrade)
  score           BIGINT NOT NULL DEFAULT 0,

  -- Timestamps
  last_resource_tick  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kingdoms_user_id ON kingdoms(user_id);
CREATE INDEX idx_kingdoms_score ON kingdoms(score DESC);

-- ============================================================
-- BUILDINGS
-- ============================================================
CREATE TYPE building_type AS ENUM (
  'town_hall',
  'gold_mine',
  'lumber_mill',
  'stone_quarry',
  'farm',
  'barracks',
  'academy',
  'wall',
  'watch_tower'
);

CREATE TABLE buildings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id      UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  type            building_type NOT NULL,
  level           SMALLINT NOT NULL DEFAULT 1,
  -- When upgrade finishes (NULL = not upgrading)
  upgrade_ends_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (kingdom_id, type)
);

CREATE INDEX idx_buildings_kingdom_id ON buildings(kingdom_id);

-- ============================================================
-- UNITS (army per kingdom)
-- ============================================================
CREATE TYPE unit_type AS ENUM (
  'spearman',
  'archer',
  'swordsman',
  'cavalry',
  'catapult',
  'elite_guard'
);

CREATE TABLE units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id  UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  type        unit_type NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  -- Training queue: how many are being trained and when done
  training_count  INTEGER NOT NULL DEFAULT 0,
  training_ends_at TIMESTAMPTZ,

  UNIQUE (kingdom_id, type)
);

CREATE INDEX idx_units_kingdom_id ON units(kingdom_id);

-- ============================================================
-- BATTLES
-- ============================================================
CREATE TYPE battle_result AS ENUM ('attacker_wins', 'defender_wins', 'draw');

CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_id     UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  defender_id     UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  result          battle_result NOT NULL,

  -- Power at time of battle
  attacker_power  INTEGER NOT NULL,
  defender_power  INTEGER NOT NULL,

  -- Loot transferred
  gold_looted     BIGINT NOT NULL DEFAULT 0,
  wood_looted     BIGINT NOT NULL DEFAULT 0,
  stone_looted    BIGINT NOT NULL DEFAULT 0,

  -- Unit losses (JSON: { spearman: 5, archer: 2, ... })
  attacker_losses JSONB NOT NULL DEFAULT '{}',
  defender_losses JSONB NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_battles_attacker_id ON battles(attacker_id);
CREATE INDEX idx_battles_defender_id ON battles(defender_id);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);

-- ============================================================
-- ALLIANCES
-- ============================================================
CREATE TABLE alliances (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(64) UNIQUE NOT NULL,
  tag         VARCHAR(6) UNIQUE NOT NULL,   -- e.g. [WAR]
  description TEXT,
  leader_id   UUID NOT NULL REFERENCES kingdoms(id) ON DELETE RESTRICT,
  score       BIGINT NOT NULL DEFAULT 0,
  max_members SMALLINT NOT NULL DEFAULT 50,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alliances_score ON alliances(score DESC);

CREATE TYPE alliance_role AS ENUM ('leader', 'officer', 'member');

CREATE TABLE alliance_members (
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  kingdom_id  UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  role        alliance_role NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (alliance_id, kingdom_id)
);

-- ============================================================
-- ALLIANCE WARS
-- ============================================================
CREATE TABLE alliance_wars (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_a_id   UUID NOT NULL REFERENCES alliances(id),
  alliance_b_id   UUID NOT NULL REFERENCES alliances(id),
  score_a         INTEGER NOT NULL DEFAULT 0,
  score_b         INTEGER NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  winner_id       UUID REFERENCES alliances(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESEARCH
-- ============================================================
CREATE TYPE research_type AS ENUM (
  'economy_1', 'economy_2', 'economy_3',
  'military_1', 'military_2', 'military_3',
  'defense_1', 'defense_2', 'defense_3',
  'speed_1', 'speed_2', 'speed_3'
);

CREATE TABLE researches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id      UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  type            research_type NOT NULL,
  level           SMALLINT NOT NULL DEFAULT 0,
  research_ends_at TIMESTAMPTZ,

  UNIQUE (kingdom_id, type)
);

-- ============================================================
-- HEROES
-- ============================================================
CREATE TYPE hero_type AS ENUM ('king_arthur', 'ragnar', 'leonidas');

CREATE TABLE heroes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id  UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  type        hero_type NOT NULL,
  level       SMALLINT NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (kingdom_id, type)
);

-- ============================================================
-- QUESTS / MISSIONS
-- ============================================================
CREATE TYPE quest_period AS ENUM ('daily', 'weekly');

CREATE TABLE quests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id  UUID NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  quest_key   VARCHAR(64) NOT NULL,   -- e.g. 'collect_gold_1000'
  period      quest_period NOT NULL,
  progress    INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- resets daily/weekly

  UNIQUE (kingdom_id, quest_key, period_date)
);

CREATE INDEX idx_quests_kingdom_period ON quests(kingdom_id, period_date);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE referral_rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone       INTEGER NOT NULL,  -- 1, 5, 10, 50
  gems_rewarded   INTEGER NOT NULL,
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (referrer_id, milestone)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(64) NOT NULL,  -- 'attack', 'shield_expired', 'build_done', etc.
  payload     JSONB NOT NULL DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- ============================================================
-- VIP SUBSCRIPTIONS
-- ============================================================
CREATE TABLE vip_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ton_tx_hash VARCHAR(128),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
