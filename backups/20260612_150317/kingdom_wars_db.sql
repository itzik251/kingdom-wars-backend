--
-- PostgreSQL database dump
--

\restrict Od4VM9X1EZpfhhL1UpOQWpZAdPulYyVy5k5i5l4kWq3aMdiVCZbTiBGnZhuSXwK

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_reward_tokens; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.ad_reward_tokens (
    token character varying(256) NOT NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL,
    kingdom_id uuid NOT NULL
);


ALTER TABLE public.ad_reward_tokens OWNER TO kw_user;

--
-- Name: alliance_members; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.alliance_members (
    alliance_id uuid NOT NULL,
    kingdom_id uuid NOT NULL,
    role character varying DEFAULT 'member'::character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alliance_members OWNER TO kw_user;

--
-- Name: alliances; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.alliances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    tag character varying(6) NOT NULL,
    description character varying,
    score bigint DEFAULT '0'::bigint NOT NULL,
    max_members smallint DEFAULT '50'::smallint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    leader_id uuid
);


ALTER TABLE public.alliances OWNER TO kw_user;

--
-- Name: antibot_bans; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.antibot_bans (
    user_id character varying(36) NOT NULL,
    banned_until timestamp with time zone NOT NULL,
    reason text,
    score integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.antibot_bans OWNER TO kw_user;

--
-- Name: battle_logs; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.battle_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attacker_kingdom_id character varying NOT NULL,
    defender_kingdom_id character varying NOT NULL,
    attacker_name character varying,
    defender_name character varying,
    attacker_wins boolean NOT NULL,
    loot text,
    attacker_power integer,
    defender_power integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.battle_logs OWNER TO kw_user;

--
-- Name: buildings; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.buildings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    upgrade_ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    kingdom_id uuid,
    slot integer DEFAULT 0 NOT NULL,
    needs_repair boolean DEFAULT false NOT NULL,
    repair_ends_at timestamp without time zone
);


ALTER TABLE public.buildings OWNER TO kw_user;

--
-- Name: kingdoms; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.kingdoms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying DEFAULT 'My Kingdom'::character varying NOT NULL,
    gold integer DEFAULT 500 NOT NULL,
    wood integer DEFAULT 300 NOT NULL,
    stone integer DEFAULT 200 NOT NULL,
    food integer DEFAULT 100 NOT NULL,
    gems integer DEFAULT 50 NOT NULL,
    max_gold integer DEFAULT 5000 NOT NULL,
    max_wood integer DEFAULT 4000 NOT NULL,
    max_stone integer DEFAULT 3000 NOT NULL,
    max_food integer DEFAULT 2000 NOT NULL,
    shield_until timestamp without time zone,
    score integer DEFAULT 0 NOT NULL,
    last_resource_tick timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid,
    win_streak integer DEFAULT 0 NOT NULL,
    production_boost_until timestamp without time zone,
    vip_expires_at timestamp without time zone,
    ads_watched_today integer DEFAULT 0 NOT NULL,
    ads_watched_date character varying,
    workers integer DEFAULT 0 NOT NULL,
    max_workers integer DEFAULT 5 NOT NULL,
    shield_expired_notified_at timestamp without time zone,
    last_attack_at timestamp without time zone,
    usdt_balance double precision DEFAULT '0'::double precision NOT NULL,
    game_balance double precision DEFAULT '0'::double precision NOT NULL,
    attack_speed_boost_until timestamp without time zone,
    withdrawal_wallet character varying,
    withdrawal_pending double precision DEFAULT '0'::double precision NOT NULL,
    withdrawal_status character varying DEFAULT 'none'::character varying NOT NULL
);


ALTER TABLE public.kingdoms OWNER TO kw_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying NOT NULL,
    payload text DEFAULT '{}'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id uuid
);


ALTER TABLE public.notifications OWNER TO kw_user;

--
-- Name: quests; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.quests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quest_key character varying NOT NULL,
    period character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    target integer NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    reward_claimed boolean DEFAULT false NOT NULL,
    period_date date DEFAULT ('now'::text)::date NOT NULL,
    kingdom_id uuid
);


ALTER TABLE public.quests OWNER TO kw_user;

--
-- Name: units; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.units (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    training_count integer DEFAULT 0 NOT NULL,
    training_ends_at timestamp without time zone,
    kingdom_id uuid,
    wounded_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.units OWNER TO kw_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    telegram_id character varying NOT NULL,
    username character varying,
    first_name character varying,
    avatar_url character varying,
    referral_code character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login timestamp without time zone,
    referred_by uuid,
    claimed_referral_milestones text DEFAULT ''::text NOT NULL,
    language character varying DEFAULT 'en'::character varying NOT NULL,
    terms_accepted_at timestamp without time zone,
    referral_claimed_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO kw_user;

--
-- Name: vip_tx_hashes; Type: TABLE; Schema: public; Owner: kw_user
--

CREATE TABLE public.vip_tx_hashes (
    tx_hash character varying(128) NOT NULL,
    user_id uuid NOT NULL,
    activated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vip_tx_hashes OWNER TO kw_user;

--
-- Data for Name: ad_reward_tokens; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.ad_reward_tokens (token, used_at, kingdom_id) FROM stdin;
\.


--
-- Data for Name: alliance_members; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.alliance_members (alliance_id, kingdom_id, role, joined_at) FROM stdin;
\.


--
-- Data for Name: alliances; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.alliances (id, name, tag, description, score, max_members, created_at, leader_id) FROM stdin;
\.


--
-- Data for Name: antibot_bans; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.antibot_bans (user_id, banned_until, reason, score, created_at) FROM stdin;
\.


--
-- Data for Name: battle_logs; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.battle_logs (id, attacker_kingdom_id, defender_kingdom_id, attacker_name, defender_name, attacker_wins, loot, attacker_power, defender_power, created_at) FROM stdin;
5b396302-2cf9-4ede-b280-ed9dd5992a0b	746c4b4a-446f-45c0-98ac-2dc921edca96	2de1803f-93db-4b33-8032-b95927f1339d	I's Kingdom	Itzik's Kingdom	t	{"gold":1500,"wood":1200,"stone":900}	1040	0	2026-06-05 06:27:14.0067
82bcafc1-8e2d-44d8-bf52-37baa62aff73	746c4b4a-446f-45c0-98ac-2dc921edca96	2de1803f-93db-4b33-8032-b95927f1339d	I's Kingdom	Itzik's Kingdom	t	{"gold":560,"wood":448,"stone":335}	890	0	2026-06-05 08:32:01.707476
d1080ba1-46c4-43a5-82b2-14380c7d585a	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	b963184a-af92-415e-90cc-a58d7b175bc5	מנשה's Kingdom	David's Kingdom	t	{"gold":1500,"wood":1200,"stone":900}	10	0	2026-06-05 09:15:34.864874
051c7429-a1f7-493f-89ac-f125e650ce00	746c4b4a-446f-45c0-98ac-2dc921edca96	b963184a-af92-415e-90cc-a58d7b175bc5	I's Kingdom	David's Kingdom	t	{"gold":581,"wood":465,"stone":348}	905	1	2026-06-05 12:40:58.806774
a448540f-c790-4ba7-be23-cf13e186e530	746c4b4a-446f-45c0-98ac-2dc921edca96	2de1803f-93db-4b33-8032-b95927f1339d	I's Kingdom	Itzik's Kingdom	t	{"gold":548,"wood":437,"stone":326}	1019	0	2026-06-05 12:43:44.817078
58b63957-c95a-4659-aa2f-13d358c229a6	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	746c4b4a-446f-45c0-98ac-2dc921edca96	מנשה's Kingdom	I's Kingdom	f	{"gold":0,"wood":0,"stone":0}	17	651	2026-06-05 12:56:55.300529
ff42d7c2-b0e5-4084-95c6-f4eeb906e737	746c4b4a-446f-45c0-98ac-2dc921edca96	b963184a-af92-415e-90cc-a58d7b175bc5	I's Kingdom	David's Kingdom	t	{"gold":526,"wood":421,"stone":314}	1097	1	2026-06-05 14:39:37.700335
f77f182f-7eb9-434c-ac89-ffbd55bc8b49	746c4b4a-446f-45c0-98ac-2dc921edca96	2de1803f-93db-4b33-8032-b95927f1339d	I's Kingdom	Itzik's Kingdom	t	{"gold":499,"wood":398,"stone":297}	878	0	2026-06-05 14:41:14.940688
a82dcc31-7a20-46b6-ae5f-62b6d7d1e562	746c4b4a-446f-45c0-98ac-2dc921edca96	2de1803f-93db-4b33-8032-b95927f1339d	I's Kingdom	Itzik's Kingdom	t	{"gold":750,"wood":600,"stone":450}	1096	0	2026-06-06 17:49:53.648561
4fa65087-9a82-41b2-8f79-0147190515f5	746c4b4a-446f-45c0-98ac-2dc921edca96	b963184a-af92-415e-90cc-a58d7b175bc5	I's Kingdom	David's Kingdom	t	{"gold":750,"wood":600,"stone":450}	1093	1	2026-06-06 17:50:13.514413
63c07a37-cb32-4a2a-9c92-e8588ffedfc7	746c4b4a-446f-45c0-98ac-2dc921edca96	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	I's Kingdom	Maor's Kingdom	t	{"gold":750,"wood":600,"stone":450}	1037	0	2026-06-06 17:50:22.223486
8ef30990-1642-474c-9d4a-d4c6768af03c	746c4b4a-446f-45c0-98ac-2dc921edca96	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	I's Kingdom	מנשה's Kingdom	t	{"gold":994,"wood":960,"stone":720}	1081	15	2026-06-06 17:50:25.930058
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.buildings (id, type, level, upgrade_ends_at, created_at, kingdom_id, slot, needs_repair, repair_ends_at) FROM stdin;
56be8635-d39c-4d5e-8f1f-752510cdd54d	town_hall	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
dfa8969d-c3ae-44e7-8c72-a10ad04cbfc4	gold_mine	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
6e81866e-708e-428a-9d4d-8c9e1c91db10	lumber_mill	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
ab8bbb28-c81c-4268-8e69-a4fe7ffb0bcc	stone_quarry	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
3ffa79a1-12cb-4573-842b-12c5d7fc53dd	farm	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
bb376f8e-264b-4d41-8ac0-ee5a5af3cccc	barracks	1	\N	2026-06-02 05:52:00.401256	2de1803f-93db-4b33-8032-b95927f1339d	0	f	\N
a9dc90ee-fffd-458e-a09a-bbbc65d004be	town_hall	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
3ca28894-b91e-4356-aaad-e8aa29f4f124	gold_mine	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
6fc599b5-ae3c-4b29-a909-2520d2587f0a	stone_quarry	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
3b8e3cdb-aafe-4340-9f90-e06e425d5b11	farm	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
4a0e6df6-7538-499a-ac95-396bc8626e0a	barracks	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
215c450f-40d6-4728-9277-469f78c32bd1	watch_tower	2	\N	2026-06-03 07:19:58.264915	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
6d168fa2-0d6b-45d1-ae29-e89fa4065d87	town_hall	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
86fb518b-1c7b-4de9-a0bd-e69632a0f07b	gold_mine	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
f65a060e-a9dc-43e7-abf2-f9a2d77acd20	lumber_mill	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
09f6eeda-42e9-4124-9453-5341129ceef9	stone_quarry	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
4ccdc3fd-3aa2-42e7-96ac-4d67d8d337ff	farm	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
cc29c56c-88c3-42cf-a907-537f5aeca7eb	barracks	1	\N	2026-06-04 08:56:58.304091	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0	f	\N
576a95cb-41cb-45d8-8a2f-ad8fa56287c8	town_hall	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
d092e654-e8c7-4933-8a78-2d36566720e5	gold_mine	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
218651a4-59c1-4474-bf8e-983f78f554a1	lumber_mill	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
6ecb3fa2-ea69-4601-8ccb-fce505934f03	stone_quarry	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
72e85746-9077-4bad-b0fd-a1435da358d0	farm	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
6d96d0cc-c927-45ee-bbc0-a96c2ebe671f	stone_quarry	4	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
ed59b604-9172-43ce-9ff1-fd3ee0b58a7a	barracks	1	\N	2026-06-04 11:08:40.814837	402f21aa-776c-4f8d-9652-ff051982ce8b	0	f	\N
7e6b6e02-2a33-49e0-afb8-25d2af905cc8	town_hall	1	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	f	\N
4f766883-8efa-40bd-a79c-bd7cbede41e5	town_hall	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
97fe14fb-a852-4eb7-9ef5-564a56e76da8	gold_mine	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
a87e4eed-ea0c-4648-bc70-eae057b93cae	lumber_mill	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
ba5cbd36-c70f-45b6-83b1-7c78e5820e44	stone_quarry	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
72780559-2c04-42c0-b243-4d787c072650	farm	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
667fabcd-d053-4ad6-8a9e-d0648605308b	barracks	1	\N	2026-06-04 15:35:15.828834	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0	f	\N
c44f44a8-3689-4206-a02a-d17a151ed379	stone_quarry	2	\N	2026-06-05 12:46:59.328883	746c4b4a-446f-45c0-98ac-2dc921edca96	2	f	\N
58ad82e6-090c-4a0c-b284-55badea21452	lumber_mill	5	\N	2026-06-03 07:06:57.478678	746c4b4a-446f-45c0-98ac-2dc921edca96	1	f	\N
4985cd25-1e55-4723-b1e2-dea23f0719f8	lumber_mill	4	\N	2026-06-05 12:46:54.083869	746c4b4a-446f-45c0-98ac-2dc921edca96	2	f	\N
d4d012ca-7691-40ae-89b3-5ef0f882e337	lumber_mill	5	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
285e3875-ddfa-4f76-aa28-1503e6424b03	arcane_tower	2	\N	2026-06-04 18:46:50.653455	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
3996e144-54b0-43d1-ab61-1647962a1133	town_hall	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
b100b2e9-b007-4f49-b9f2-64b7cc141abd	farm	4	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	t	\N
fbd59783-456f-4b78-94fe-78e19f3ec892	farm	10	2026-06-12 12:12:13.859	2026-06-03 13:46:56.100147	746c4b4a-446f-45c0-98ac-2dc921edca96	1	f	\N
8966d7b0-2f6a-4bd0-84b2-0c15ebb70978	barracks	12	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
148fa69a-e47f-47d0-ae1c-85c8deae0f58	lumber_mill	1	\N	2026-06-02 08:53:05.114436	b963184a-af92-415e-90cc-a58d7b175bc5	0	f	\N
4dd071dd-e035-4a0b-a3e4-da4953606ef3	farm	7	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
019a3340-adca-4ff9-bf4c-dd504e5b8cd8	gold_mine	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
ba72b91f-858f-4966-9439-812993c3ecf4	lumber_mill	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
ea033025-d93c-415c-85fd-75a600e978f1	farm	5	\N	2026-06-05 06:24:09.199421	746c4b4a-446f-45c0-98ac-2dc921edca96	2	f	\N
207be8d9-46dc-4fa0-8e30-dba43925646c	town_hall	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
8d98be63-bc59-4abd-9168-fde5b4a42b45	stone_quarry	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
d09ca44f-b37c-4da8-bff2-e3636ade6e86	gold_mine	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
7a04cdf5-9c19-4a07-b273-7de2c21ce82e	lumber_mill	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
ca396df4-b988-4c05-afde-277f18d99004	stone_quarry	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
2e01deda-1fb0-4758-8f9d-17c84d4f4ed4	farm	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
d8a1ddbf-1d6c-4530-94f6-084f9e4d2710	barracks	1	\N	2026-06-06 19:44:41.184686	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0	f	\N
5949466c-f181-4498-b520-50f17ed0bf7a	wall	3	\N	2026-06-07 15:31:39.139459	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	t	\N
ac4612f9-6d18-48ea-b8b5-4340a32910c0	stone_quarry	3	\N	2026-06-03 14:11:27.233232	746c4b4a-446f-45c0-98ac-2dc921edca96	1	f	\N
3ae2116e-cfc5-4ca7-9aec-a9f3a0a2f5a0	lumber_mill	5	\N	2026-06-06 19:55:40.511107	746c4b4a-446f-45c0-98ac-2dc921edca96	3	f	\N
8249d57c-4239-43fa-a7c5-7a7c8c22eb4c	gold_mine	4	\N	2026-06-03 14:11:17.342051	746c4b4a-446f-45c0-98ac-2dc921edca96	1	f	\N
94e76b69-9286-4124-be81-7a06f26e9a9f	lumber_mill	5	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	f	\N
fd54078e-e069-4359-8761-20995c0b2a05	town_hall	12	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
5491945c-a7d9-4838-ab1d-6c4ead7f3f7f	farm	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
9cc8bfa8-7050-4cb7-8d5d-cd4c768b1056	wall	6	\N	2026-06-03 07:06:38.776557	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
358c9e06-43d8-4c10-b276-5b7028be8cdd	lumber_mill	3	\N	2026-06-08 07:25:26.100617	746c4b4a-446f-45c0-98ac-2dc921edca96	5	f	\N
490c4753-4982-4724-bef9-6b77760f2325	barracks	1	\N	2026-06-07 14:30:13.146381	03ec9863-5a43-4a56-862c-87a7327d758a	0	f	\N
8265eeb5-7e0b-4099-ba92-0a6efee4fa89	barracks	3	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	t	\N
8a5cebb2-33a8-47f3-b079-dfe035509f37	gold_mine	5	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	f	\N
4a0b5591-e37e-4026-b25a-45ae72fc8cf8	stone_quarry	1	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	t	\N
26fe0cf4-ae26-42c6-8a07-5db49511eea8	barracks	1	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	t	\N
601b2386-f61f-4953-8ead-ff3fd5c479d9	stone_quarry	2	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	t	\N
20fb232d-c585-4ea6-a599-c49804a44dbc	stone_quarry	2	\N	2026-06-07 04:46:11.664611	746c4b4a-446f-45c0-98ac-2dc921edca96	4	f	\N
8d28d92e-c8fb-4d34-bffb-7366233f5ceb	stone_quarry	2	\N	2026-06-07 04:42:50.492496	746c4b4a-446f-45c0-98ac-2dc921edca96	3	f	\N
3e544bf3-60f6-4995-afbb-27977031039a	lumber_mill	3	\N	2026-06-07 21:24:50.634021	746c4b4a-446f-45c0-98ac-2dc921edca96	4	f	\N
950103bd-5177-4b7d-ba9d-c2032137c4b4	gold_mine	5	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
ff9bd415-4414-499a-929f-0be3b118b63d	town_hall	7	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
99d7a5e2-941b-46d7-8546-2018f29a2e21	town_hall	5	\N	2026-06-03 15:05:48.851536	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0	f	\N
fb8dfcf8-f0da-46c2-bcce-86239f266d4b	lumber_mill	1	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	t	\N
b679ca63-237e-4983-91f9-34d702f99ce0	farm	8	2026-06-12 12:07:28.32	2026-06-06 19:53:00.326071	746c4b4a-446f-45c0-98ac-2dc921edca96	3	f	\N
8ab356f1-4c03-4b16-874a-5aa005e5ad0d	academy	7	\N	2026-06-03 11:33:06.416207	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
63791fc1-cac6-4507-a2fc-56a9ae4965f6	farm	1	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	t	\N
b184d2f6-1598-426e-87e6-369a18ad1551	hospital	7	\N	2026-06-03 13:58:27.886419	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
967e8ec4-6084-483b-9cd7-7db26085b7f3	gold_mine	2	\N	2026-06-03 15:50:45.892296	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0	f	\N
bc75345d-1dea-4028-88b6-e6b508bbb5b4	lumber_mill	4	\N	2026-06-10 18:04:27.155051	130d40b6-ff88-4a09-9912-37398c79d3d2	1	f	\N
1712a601-4d83-42cd-a60a-3a739d38b035	gold_mine	3	\N	2026-06-12 11:34:10.183115	130d40b6-ff88-4a09-9912-37398c79d3d2	3	f	\N
8be9969d-383f-45a3-930c-7e591f4fcfcb	stone_quarry	1	\N	2026-06-10 15:35:02.290554	746c4b4a-446f-45c0-98ac-2dc921edca96	5	f	\N
ffabf4da-0abb-4fcf-b034-491bbf03dce0	gem_forge	4	\N	2026-06-10 15:11:49.831041	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
bcfbe668-ac6d-4d94-8242-7b320d0a9c43	gem_forge	3	\N	2026-06-10 16:19:33.594901	746c4b4a-446f-45c0-98ac-2dc921edca96	1	f	\N
ff8a8db5-bbf7-4244-ad26-227e66c77b1f	gold_mine	2	\N	2026-06-12 08:17:38.151402	746c4b4a-446f-45c0-98ac-2dc921edca96	5	f	\N
d74a3b0c-fce6-47c8-8d4e-5a6f8576fc70	gem_forge	3	\N	2026-06-10 16:46:51.529335	746c4b4a-446f-45c0-98ac-2dc921edca96	2	f	\N
db6aae54-d50a-41cb-8da3-3c43f82cb39f	farm	6	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
f528e10c-839b-445d-8a4e-b1d3987e61d0	gold_mine	3	\N	2026-06-07 21:24:44.591051	746c4b4a-446f-45c0-98ac-2dc921edca96	4	f	\N
6f416ad5-e392-4c41-90b2-d6c5aa3b0b67	gold_mine	6	\N	2026-06-02 05:52:37.039332	746c4b4a-446f-45c0-98ac-2dc921edca96	0	f	\N
c11cff58-21b5-4d90-9081-9afd347273b0	gold_mine	3	\N	2026-06-05 12:46:57.362038	746c4b4a-446f-45c0-98ac-2dc921edca96	2	f	\N
6310426d-026e-4198-9b2a-ccd776069184	farm	4	\N	2026-06-12 08:17:40.547048	746c4b4a-446f-45c0-98ac-2dc921edca96	5	f	\N
29b865ed-52d8-4a3a-8a43-cb72dd699c1e	farm	2	\N	2026-06-10 16:22:11.857029	746c4b4a-446f-45c0-98ac-2dc921edca96	4	f	\N
73ed8da9-fb88-4643-9c82-c9cf9eac7dee	stone_quarry	2	\N	2026-06-12 11:36:07.538797	130d40b6-ff88-4a09-9912-37398c79d3d2	2	f	\N
84bd96c1-0a77-4f6d-996e-e7a222b0c957	watch_tower	4	\N	2026-06-12 04:34:39.406152	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
043a1c31-7533-4af6-9971-2763a4357940	hospital	4	\N	2026-06-08 12:06:56.953947	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
9f09ca97-7d7d-44f5-9932-625319bf0a97	barracks	5	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
43582c01-7dcb-45e1-94d3-b5e40e98fe88	stone_quarry	5	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	t	\N
92e45fdd-362b-4d20-a600-6a47699f6977	gold_mine	4	\N	2026-06-08 08:10:46.97916	130d40b6-ff88-4a09-9912-37398c79d3d2	1	f	\N
7d1591db-a439-4125-bef6-e5e07d12c5bc	farm	6	\N	2026-06-10 03:28:21.592204	130d40b6-ff88-4a09-9912-37398c79d3d2	1	f	\N
9f39374b-b285-4062-b9a9-6a6028bb38dc	lumber_mill	4	\N	2026-06-10 18:18:59.405579	130d40b6-ff88-4a09-9912-37398c79d3d2	2	f	\N
687f8a10-8783-4e6c-8494-70c2a71606fb	farm	6	\N	2026-06-12 04:27:09.141614	130d40b6-ff88-4a09-9912-37398c79d3d2	3	f	\N
94edbcf7-9919-443d-b9a2-83d9f3e33e42	lumber_mill	4	\N	2026-06-08 07:44:49.292339	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
a4794bba-a465-46ff-88b5-7e474c6b6942	stone_quarry	3	\N	2026-06-10 18:04:49.468405	130d40b6-ff88-4a09-9912-37398c79d3d2	1	t	\N
bf33a221-f539-48b2-ab37-0e782411a682	wall	9	\N	2026-06-08 08:10:31.633571	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
f33e4358-eaac-48bc-b0ea-558cf35c59a6	academy	3	\N	2026-06-10 18:10:09.578614	130d40b6-ff88-4a09-9912-37398c79d3d2	0	f	\N
96a4d125-0cd6-4425-8244-417ca37c79c9	town_hall	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
55fa5d9a-15fe-42fb-bec1-96a6528a8631	gold_mine	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
c5aff565-6949-4051-a5fb-9666f232a673	lumber_mill	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
e8398b38-939b-4144-8190-d5744212f6df	stone_quarry	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
3cf3f4bd-19ab-4524-9a96-b119e8a5b230	farm	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
1cd5433e-ac6e-4f17-bad4-f0c9c61761ba	barracks	1	\N	2026-06-10 08:29:22.306939	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0	f	\N
87a8879e-a3d8-4ec8-b0c3-fb5520908de8	town_hall	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
eb9c851e-7b88-4785-8a84-2ffb4d0ed7f3	gold_mine	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
577af930-ba50-47bc-b9ef-751101cb8fb4	lumber_mill	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
319a009b-2026-4bb4-91d7-7054ab2f985c	stone_quarry	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
32379913-bf0c-4a58-9632-390eb847f970	farm	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
8bd6ed0d-2c2c-4d3d-9f53-128de675c3ba	barracks	1	\N	2026-06-10 09:31:46.932724	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0	f	\N
56c4eb63-c913-4342-bcc6-7a930b48761f	town_hall	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
ec233016-37a6-4d9e-b11b-9fef9dd0dadb	gold_mine	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
16d6ab10-a26a-47bc-bee8-8da8a52e25a9	lumber_mill	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
a4da5c8b-6e58-46d2-8fef-edc739b7e267	stone_quarry	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
a1e7d152-c006-476e-a387-5baab2673ea0	farm	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
47556089-80ad-4a91-9e65-a3ce386ed8ca	barracks	1	\N	2026-06-10 11:23:09.490518	a9f9191f-3c7f-49a5-a578-0654713a4b89	0	f	\N
27aac6d5-1b53-4736-92ac-baf90a7518b1	gold_mine	1	\N	2026-06-07 04:33:27.446835	746c4b4a-446f-45c0-98ac-2dc921edca96	3	f	\N
1d74375b-5ecb-444e-a49d-5280b6a3213d	gold_mine	4	\N	2026-06-12 04:26:43.113118	130d40b6-ff88-4a09-9912-37398c79d3d2	2	f	\N
61770bc0-2bee-48bf-870c-031fa96863b3	farm	6	\N	2026-06-10 18:10:36.937574	130d40b6-ff88-4a09-9912-37398c79d3d2	2	f	\N
\.


--
-- Data for Name: kingdoms; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.kingdoms (id, name, gold, wood, stone, food, gems, max_gold, max_wood, max_stone, max_food, shield_until, score, last_resource_tick, created_at, user_id, win_streak, production_boost_until, vip_expires_at, ads_watched_today, ads_watched_date, workers, max_workers, shield_expired_notified_at, last_attack_at, usdt_balance, game_balance, attack_speed_boost_until, withdrawal_wallet, withdrawal_pending, withdrawal_status) FROM stdin;
946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	Maor's Kingdom	2872	2242	1681	2000	44	5000	4000	3000	2000	2026-06-12 12:35:23.312	0	2026-06-12 12:00:00.024	2026-06-03 15:50:45.889374	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c	0	\N	\N	0	\N	0	5	2026-06-08 13:09:45.311	\N	0	0	\N	\N	0	none
130d40b6-ff88-4a09-9912-37398c79d3d2	🦁 AdaMic	268	163	2631	2283	0	14300	11200	8400	5600	2026-06-12 12:46:30.119	365	2026-06-12 12:00:00.047	2026-06-08 07:44:49.288127	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4	21	\N	2026-07-12 05:42:35.03	3	2026-06-12	6	10	2026-06-12 00:02:11.899	2026-06-12 11:40:04.545	8	0	\N	\N	0	none
b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	משה's Kingdom	2513	2004	1496	2000	43	5000	4000	3000	2000	2026-06-12 12:40:04.545	0	2026-06-12 12:00:00.104	2026-06-06 19:44:41.180035	fcb14d93-2053-4ac3-93e8-85ba2cd78717	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
b963184a-af92-415e-90cc-a58d7b175bc5	🏰 Melech	4308	3446	2584	2000	43	5000	4000	3000	2000	2026-06-12 12:32:07.311	0	2026-06-12 12:00:00.169	2026-06-02 08:53:05.110241	0d5907f3-6feb-44c6-8f4f-43687783261f	0	\N	\N	0	\N	0	5	2026-06-07 12:57:22.464	2026-06-07 11:25:45.133	0	0	\N	\N	0	none
2de1803f-93db-4b33-8032-b95927f1339d	Itzik's Kingdom	2652	2169	1626	1996	51	5000	4000	3000	2000	2026-06-12 12:32:42.884	0	2026-06-12 12:00:00.265	2026-06-02 05:52:00.38967	894e2ff9-f989-4d35-af52-3c1ec8033b6d	0	\N	\N	0	\N	3	5	\N	\N	0	0	\N	\N	0	none
a9f9191f-3c7f-49a5-a578-0654713a4b89	Kvander's Kingdom	5000	4000	3000	1888	100	5000	4000	3000	2000	2026-06-13 11:23:09.485	0	2026-06-12 12:00:00.424	2026-06-10 11:23:09.486186	d3fc6f10-5d93-4f88-978c-977963d7c74d	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
f75e5129-48c8-4d36-a4ae-38ac3547b2a8	mario's Kingdom	5000	4000	3000	2000	50	5000	4000	3000	2000	2026-06-13 08:29:22.296	0	2026-06-12 12:00:00.453	2026-06-10 08:29:22.298826	74607d68-28e1-4d50-8281-57ad37e40d32	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
a87c98e6-fa02-41c7-b517-5f9b7fe87af7	מנשה's Kingdom	6890	5512	4116	3200	170	8000	6400	4800	3200	2026-06-12 12:33:08.436	56	2026-06-12 12:00:00.481	2026-06-03 15:05:48.847519	01271206-b687-44cb-a820-612b7ddc6593	0	2026-06-07 16:26:09.124	\N	4	2026-06-07	0	5	2026-06-08 15:35:00.798	2026-06-07 15:35:02.064	0	0	\N	\N	0	none
03ec9863-5a43-4a56-862c-87a7327d758a	Yosef's Kingdom	4299	3439	2579	2000	133	5000	4000	3000	2000	2026-06-12 12:37:35.854	0	2026-06-12 12:00:00.531	2026-06-07 14:30:13.142797	c54f3d04-0339-4321-8c0e-6ee30041bf65	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
746c4b4a-446f-45c0-98ac-2dc921edca96	🏰 kwi	4448	10759	12900	4024	699	21500	17200	12900	9500	2026-06-13 11:47:02.231	909	2026-06-12 12:03:30.376	2026-06-02 05:52:37.030882	118d280b-f01f-4afb-8efc-81618fdc8170	1	2026-06-12 08:05:31.182	2026-07-10 18:33:29.611	4	2026-06-12	11	11	\N	2026-06-12 11:46:30.119	7.408	0	2026-06-10 13:14:06.516	\N	0	none
8b6fee86-e9aa-4845-80a6-792ef2e9e997	.'s Kingdom	5000	4000	3000	2000	60	5000	4000	3000	2000	2026-06-13 09:31:46.928	0	2026-06-12 12:00:00.766	2026-06-10 09:31:46.928684	73476f2f-7699-4fce-afe2-9eb20831f3b5	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
402f21aa-776c-4f8d-9652-ff051982ce8b	AdsGram.ai's Kingdom	1380	1098	816	2000	43	5000	4000	3000	2000	2026-06-12 12:29:53.172	0	2026-06-12 12:00:00.777	2026-06-04 11:08:40.811771	02f52ce4-587a-4cfb-91a8-da93a1668820	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
e69fc33e-6895-4c64-903a-37a0f6ab3e33	Leo's Kingdom	4299	3439	2579	2000	51	5000	4000	3000	2000	2026-06-12 12:37:46.479	0	2026-06-12 12:00:00.795	2026-06-04 15:35:15.825808	6bf59c72-777f-4166-8d45-5a57721d6c49	0	\N	\N	2	2026-06-10	0	5	2026-06-08 13:08:57.144	\N	0	0	2026-06-10 03:59:42.041	\N	0	none
ec0f159a-e2fc-496e-9c30-f8bb3942f406	⚡ Tomer	4297	3437	2577	2000	43	5000	4000	3000	2000	2026-06-12 12:37:25.268	0	2026-06-12 12:00:00.81	2026-06-04 08:56:58.300331	a1dedbf4-4444-485e-bb47-ab46e9f96928	0	\N	\N	0	\N	0	5	\N	\N	0	0	\N	\N	0	none
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.notifications (id, type, payload, read, created_at, user_id) FROM stdin;
ba8d36b4-e882-4d22-84c5-5df62a38baf8	attacked	{"attackerName":"I's Kingdom","gold":1500,"wood":1200,"won":true,"telegramId":"7234567890"}	f	2026-06-05 06:27:13.963798	894e2ff9-f989-4d35-af52-3c1ec8033b6d
f227bb19-f510-4a62-a3fc-70c151517f90	attacked	{"attackerName":"I's Kingdom","gold":560,"wood":448,"won":true,"telegramId":"7234567890"}	f	2026-06-05 08:32:01.653695	894e2ff9-f989-4d35-af52-3c1ec8033b6d
93ec1f42-0d17-491d-a673-eedcd6536ad7	attacked	{"attackerName":"מנשה's Kingdom","gold":1500,"wood":1200,"won":true,"telegramId":"928045648"}	f	2026-06-05 09:15:34.845402	0d5907f3-6feb-44c6-8f4f-43687783261f
45481868-c50d-4af8-bd86-f15433dd704d	attacked	{"attackerName":"I's Kingdom","gold":581,"wood":465,"won":true,"telegramId":"928045648"}	f	2026-06-05 12:40:58.756205	0d5907f3-6feb-44c6-8f4f-43687783261f
17ca9395-05eb-4475-9cdc-51e0206e7295	attacked	{"attackerName":"I's Kingdom","gold":548,"wood":437,"won":true,"telegramId":"7234567890"}	f	2026-06-05 12:43:44.768051	894e2ff9-f989-4d35-af52-3c1ec8033b6d
592f2886-51c7-42bb-9ede-3eb887f1cb7e	attacked	{"attackerName":"מנשה's Kingdom","gold":0,"wood":0,"won":false,"telegramId":"6394982345"}	f	2026-06-05 12:56:55.295696	118d280b-f01f-4afb-8efc-81618fdc8170
09c7cf6d-8b8b-4da4-8cf2-affb678acbc2	attacked	{"attackerName":"I's Kingdom","gold":526,"wood":421,"won":true,"telegramId":"928045648"}	f	2026-06-05 14:39:37.670791	0d5907f3-6feb-44c6-8f4f-43687783261f
98b2a73e-a6ee-4974-85d1-1ad63e6f38c1	attacked	{"attackerName":"I's Kingdom","gold":499,"wood":398,"won":true,"telegramId":"7234567890"}	f	2026-06-05 14:41:14.909088	894e2ff9-f989-4d35-af52-3c1ec8033b6d
e13b5ecf-0a50-4ff8-83cd-63970ce48435	attacked	{"attackerName":"I's Kingdom","gold":750,"wood":600,"won":true,"telegramId":"7234567890"}	f	2026-06-06 17:49:53.613429	894e2ff9-f989-4d35-af52-3c1ec8033b6d
d1f2edd1-f99a-46d5-bbca-61d7600d9daa	attacked	{"attackerName":"I's Kingdom","gold":750,"wood":600,"won":true,"telegramId":"928045648"}	f	2026-06-06 17:50:13.484907	0d5907f3-6feb-44c6-8f4f-43687783261f
236a47be-fbfa-4e18-b9da-20593f94267b	attacked	{"attackerName":"I's Kingdom","gold":750,"wood":600,"won":true,"telegramId":"418120178"}	f	2026-06-06 17:50:22.217604	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
226b0178-85bf-46b4-b2fe-ca43101bb23c	attacked	{"attackerName":"I's Kingdom","gold":994,"wood":960,"won":true,"telegramId":"647720443"}	f	2026-06-06 17:50:25.92069	01271206-b687-44cb-a820-612b7ddc6593
299a12a2-fffd-420f-932c-60dc81f76f29	shield_expired	{}	f	2026-06-06 19:04:39.188112	118d280b-f01f-4afb-8efc-81618fdc8170
56597907-de1b-405e-9b16-364262082331	shield_expired	{}	f	2026-06-06 19:05:09.224251	118d280b-f01f-4afb-8efc-81618fdc8170
888af3f4-ecd4-4060-8674-30df8765723c	shield_expired	{}	f	2026-06-06 19:05:40.15642	118d280b-f01f-4afb-8efc-81618fdc8170
71aff9b5-9401-437b-87c4-cd28c6841987	shield_expired	{}	f	2026-06-06 19:06:10.137565	118d280b-f01f-4afb-8efc-81618fdc8170
5187247f-b9fd-400c-960c-2476c102936b	shield_expired	{}	f	2026-06-06 19:06:22.263307	118d280b-f01f-4afb-8efc-81618fdc8170
4333a6dc-29e1-4db1-b21a-3f86c0737537	shield_expired	{}	f	2026-06-06 19:06:39.213773	118d280b-f01f-4afb-8efc-81618fdc8170
c64050c8-ca76-487d-b772-aa46f2fb0c49	shield_expired	{}	f	2026-06-06 19:07:09.191707	118d280b-f01f-4afb-8efc-81618fdc8170
86c5b706-2c37-405d-ad47-74d44061e264	shield_expired	{}	f	2026-06-06 19:07:39.221048	118d280b-f01f-4afb-8efc-81618fdc8170
249b7406-f11d-47d4-8151-a9d488576ee4	shield_expired	{}	f	2026-06-06 19:08:09.198956	118d280b-f01f-4afb-8efc-81618fdc8170
0d39a839-3e38-406f-a9fa-f73c491d7d76	shield_expired	{}	f	2026-06-06 19:08:39.216021	118d280b-f01f-4afb-8efc-81618fdc8170
be5cc132-85a7-428e-8c65-3bbce16f9f15	shield_expired	{}	f	2026-06-06 19:09:09.203034	118d280b-f01f-4afb-8efc-81618fdc8170
c1699ff1-b4c7-4b1f-9723-ef7c6d8f342f	shield_expired	{}	f	2026-06-06 19:09:39.259218	118d280b-f01f-4afb-8efc-81618fdc8170
fc663bf2-db74-4d04-9ccb-6c1da3441bad	shield_expired	{}	f	2026-06-06 19:10:09.282701	118d280b-f01f-4afb-8efc-81618fdc8170
f1a0d79d-f2f9-46a1-81e6-4baf24e47b15	shield_expired	{}	f	2026-06-06 19:10:39.242116	118d280b-f01f-4afb-8efc-81618fdc8170
0b9368b4-2dac-4f07-8b7f-1e979414e8f0	shield_expired	{}	f	2026-06-06 19:11:09.202475	118d280b-f01f-4afb-8efc-81618fdc8170
6fb5548d-8204-4cb6-a773-5dd7d56f838f	shield_expired	{}	f	2026-06-06 19:11:39.226622	118d280b-f01f-4afb-8efc-81618fdc8170
a093f4b0-e9ac-42d6-a62a-3a497ccb4170	shield_expired	{}	f	2026-06-06 19:12:18.974146	118d280b-f01f-4afb-8efc-81618fdc8170
87812969-c5aa-454b-8262-0766f06bf076	shield_expired	{}	f	2026-06-06 19:12:36.002283	118d280b-f01f-4afb-8efc-81618fdc8170
3eab5a4e-212f-4bad-bf75-dd5c0dfd7681	shield_expired	{}	f	2026-06-06 19:12:42.212895	118d280b-f01f-4afb-8efc-81618fdc8170
784b52f1-91fe-4e43-b23f-175e7fdcf72e	shield_expired	{}	f	2026-06-06 19:12:52.735693	118d280b-f01f-4afb-8efc-81618fdc8170
d8cb0b9b-c790-4b64-8a43-acecdf6627d2	shield_expired	{}	f	2026-06-06 19:13:12.277116	118d280b-f01f-4afb-8efc-81618fdc8170
4e67ce79-d753-48eb-ab1d-aa3e42a46443	shield_expired	{}	f	2026-06-06 19:14:00.724248	118d280b-f01f-4afb-8efc-81618fdc8170
84a4fe4a-512b-4ef4-913d-a9bbbdb2b483	shield_expired	{}	f	2026-06-06 19:14:11.131091	118d280b-f01f-4afb-8efc-81618fdc8170
2c45df3a-4cf7-4bb2-a561-014ea86e3367	shield_expired	{}	f	2026-06-06 19:14:30.724423	118d280b-f01f-4afb-8efc-81618fdc8170
99c7e182-ce1b-4d45-8f6b-825e5e09f050	shield_expired	{}	f	2026-06-06 19:15:01.137217	118d280b-f01f-4afb-8efc-81618fdc8170
1da8afe2-212e-4239-8118-225b4762bd36	shield_expired	{}	f	2026-06-06 19:15:31.166486	118d280b-f01f-4afb-8efc-81618fdc8170
bac3a417-0f04-4f62-8a3d-6ee9d4281b79	attacked	{"attackerName":"I's Kingdom","gold":672,"wood":538,"won":true,"telegramId":"7234567890"}	f	2026-06-06 19:50:53.561345	894e2ff9-f989-4d35-af52-3c1ec8033b6d
e4e69162-14d5-49e3-b338-1322bc13d3e3	build_done	{"telegramId":"6394982345","language":"he","building":"wall","level":3}	f	2026-06-06 19:52:43.997748	118d280b-f01f-4afb-8efc-81618fdc8170
d68fdd4c-1f08-4a12-81b2-1b684c2b47b8	build_done	{"telegramId":"6394982345","language":"he","building":"stone_quarry","level":2}	f	2026-06-06 19:58:51.427265	118d280b-f01f-4afb-8efc-81618fdc8170
8aa5ea96-fc04-4271-9a76-dd6b90d65e5f	build_done	{"telegramId":"6394982345","language":"he","building":"lumber_mill","level":2}	f	2026-06-06 19:58:51.449291	118d280b-f01f-4afb-8efc-81618fdc8170
dc9ab40e-16ef-4acc-beaf-a036700fecbf	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":2}	f	2026-06-06 19:58:51.4562	118d280b-f01f-4afb-8efc-81618fdc8170
1df657cf-683b-4db6-957b-dc3ff62cc155	build_done	{"telegramId":"6394982345","language":"he","building":"stone_quarry","level":3}	f	2026-06-06 19:59:51.373519	118d280b-f01f-4afb-8efc-81618fdc8170
2e0dda40-d56a-4d85-97cb-ae3728f63bf3	attacked	{"attackerName":"I's Kingdom","gold":674,"wood":539,"won":true,"telegramId":"418120178"}	f	2026-06-06 20:03:08.930701	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
08d27ed6-afb5-483f-92a8-cc641b7f9cff	build_done	{"telegramId":"6394982345","language":"he","building":"gold_mine","level":2}	f	2026-06-06 20:06:23.915219	118d280b-f01f-4afb-8efc-81618fdc8170
e33fd142-b564-435c-b0b8-fa907629f08f	build_done	{"building":"gold_mine","level":2}	f	2026-06-06 20:06:23.954317	118d280b-f01f-4afb-8efc-81618fdc8170
3db6d163-8ba9-40a2-aa3a-3e3ccffdaba4	attacked	{"attackerName":"I's Kingdom","gold":676,"wood":540,"won":true,"telegramId":"928045648"}	f	2026-06-06 20:07:48.260167	0d5907f3-6feb-44c6-8f4f-43687783261f
42101224-885e-4d48-b894-62444991dd74	attacked	{"attackerName":"I's Kingdom","gold":889,"wood":856,"won":true,"telegramId":"647720443"}	f	2026-06-06 20:08:33.636706	01271206-b687-44cb-a820-612b7ddc6593
b27f4b33-f5b0-4837-96f2-8a106cca561b	build_done	{"building":"barracks","level":7,"count":1}	f	2026-06-06 20:20:00.226362	118d280b-f01f-4afb-8efc-81618fdc8170
7ed6fa03-b41f-4e8f-8b5f-1a2f2ae0f0ed	build_done	{"telegramId":"6394982345","language":"he","building":"barracks","level":8,"count":1}	f	2026-06-06 20:36:53.45371	118d280b-f01f-4afb-8efc-81618fdc8170
743d7241-52bf-4f5b-84f7-9e46551f07d1	build_done	{"building":"barracks","level":8,"count":1}	f	2026-06-06 20:36:53.496694	118d280b-f01f-4afb-8efc-81618fdc8170
9530e3ba-d7e9-4416-b97c-b4af41bde56e	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":1}	f	2026-06-06 20:49:00.877751	118d280b-f01f-4afb-8efc-81618fdc8170
43c101fe-f2f0-4956-bb01-9dfe29ccdb32	training_done	{"unit":"elite_guard","count":1}	f	2026-06-06 20:49:00.986897	118d280b-f01f-4afb-8efc-81618fdc8170
2c2f95ea-ab4d-4004-9f6d-c5b0f9335952	attacked	{"attackerName":"🏰 kwi","gold":711,"wood":581,"won":true,"telegramId":"7234567890"}	f	2026-06-07 04:27:50.852688	894e2ff9-f989-4d35-af52-3c1ec8033b6d
cce4343f-c42a-4729-b171-60759d9f4c69	attacked	{"attackerName":"🏰 kwi","gold":718,"wood":573,"won":true,"telegramId":"418120178"}	f	2026-06-07 04:34:44.675013	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
367e9295-9ffe-4105-9774-3433fc6c3459	build_done	{"telegramId":"6394982345","language":"he","building":"lumber_mill","level":4,"count":1}	f	2026-06-07 04:35:26.804006	118d280b-f01f-4afb-8efc-81618fdc8170
1fae3332-f9a5-406c-82fc-ff251848eccc	build_done	{"building":"lumber_mill","level":4,"count":1}	f	2026-06-07 04:35:26.84373	118d280b-f01f-4afb-8efc-81618fdc8170
c8458537-c565-47b8-8360-f7541b7e4bcb	training_done	{"telegramId":"6394982345","language":"he","unit":"dragon_rider","count":1}	f	2026-06-07 04:37:27.724823	118d280b-f01f-4afb-8efc-81618fdc8170
a9a4c941-3ddc-4e99-b376-b914693f0eb9	training_done	{"unit":"dragon_rider","count":1}	f	2026-06-07 04:37:27.752492	118d280b-f01f-4afb-8efc-81618fdc8170
0852d325-85f3-47b6-8280-ba53f6353f90	attacked	{"attackerName":"🏰 kwi","gold":720,"wood":574,"won":true,"telegramId":"928045648"}	f	2026-06-07 04:38:26.706187	0d5907f3-6feb-44c6-8f4f-43687783261f
d5e303ee-c60d-471d-9dc8-93e992d5d237	training_done	{"unit":"archer","count":1}	f	2026-06-07 14:52:42.100695	01271206-b687-44cb-a820-612b7ddc6593
1cd78930-d12d-4225-99b6-8a9aa39ebf3a	training_done	{"telegramId":"6394982345","language":"he","unit":"spearman","count":101}	f	2026-06-07 04:52:27.488366	118d280b-f01f-4afb-8efc-81618fdc8170
d79fe48b-b2a6-435f-9720-39d167cc8b9b	training_done	{"unit":"spearman","count":101}	f	2026-06-07 04:52:27.516163	118d280b-f01f-4afb-8efc-81618fdc8170
701c2d71-cab8-4426-a1dc-f7e08a3f5666	training_done	{"unit":"catapult","count":22}	f	2026-06-07 05:50:00.225908	118d280b-f01f-4afb-8efc-81618fdc8170
5c5c9b04-9d3b-4bf4-9be4-f35a276ed2b7	attacked	{"attackerName":"🏰 kwi","gold":634,"wood":520,"won":true,"telegramId":"7234567890"}	f	2026-06-07 06:15:06.96435	894e2ff9-f989-4d35-af52-3c1ec8033b6d
677a96cd-32f6-400d-91eb-36fb338a677e	attacked	{"attackerName":"🏰 kwi","gold":576,"wood":476,"won":true,"telegramId":"7234567890"}	f	2026-06-07 08:39:02.770523	894e2ff9-f989-4d35-af52-3c1ec8033b6d
d255ab18-075f-4f32-a4b1-b605decfd0d0	attacked	{"attackerName":"🏰 kwi","gold":681,"wood":543,"won":true,"telegramId":"928045648"}	f	2026-06-07 08:43:31.57338	0d5907f3-6feb-44c6-8f4f-43687783261f
226c624d-dd66-427a-92cc-2e6e8bd47c76	admin_gift	{"type":"usdt","amount":1,"label":"💵 USDT ×1","language":"he"}	f	2026-06-07 09:09:36.984861	118d280b-f01f-4afb-8efc-81618fdc8170
a35d48d2-2043-4878-89a9-a59c63e5926a	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6732523149"}	f	2026-06-07 09:21:35.556874	a1dedbf4-4444-485e-bb47-ab46e9f96928
8663ac4b-a281-4959-b2d5-57aacb921bcd	admin_gift	{"type":"gold","amount":1000,"label":"💰 זהב ×1000","language":"he"}	f	2026-06-07 10:18:53.247565	118d280b-f01f-4afb-8efc-81618fdc8170
9a9a2b14-da06-4193-a5ab-6948f2ca30d8	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 10:19:16.267697	118d280b-f01f-4afb-8efc-81618fdc8170
13b2e7ae-14cd-47de-96c2-dd4b446600b2	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 10:21:34.271527	118d280b-f01f-4afb-8efc-81618fdc8170
24262e12-c7b2-4447-b40a-94ed8119860b	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 10:22:56.717888	118d280b-f01f-4afb-8efc-81618fdc8170
cef77eba-f944-4b10-9c2e-747bf95b015a	admin_gift	{"type":"usdt","amount":19,"label":"💵 USDT ×19","language":"he"}	f	2026-06-07 10:23:17.278908	118d280b-f01f-4afb-8efc-81618fdc8170
71dbb65b-63d5-427c-8cc5-f0c5e790c055	attacked	{"attackerName":"🏰 kwi","gold":521,"wood":432,"won":true,"telegramId":"7234567890"}	f	2026-06-07 10:31:16.900302	894e2ff9-f989-4d35-af52-3c1ec8033b6d
fdb697b1-c413-4ca7-af12-3815cd5e99a4	admin_gift	{"type":"usdt","amount":20,"label":"💵 USDT ×20","language":"he"}	f	2026-06-07 10:36:19.159107	118d280b-f01f-4afb-8efc-81618fdc8170
7989a665-8fd0-4cb2-9b11-01164a4fac7e	admin_gift	{"type":"usdt_withdrawal","label":"💸 משיכת 20.0000 USDT אושרה → TRcWghysJ8fjSbzV4zDue3MjF3fXxRCdL8","language":"he"}	f	2026-06-07 10:52:49.52578	118d280b-f01f-4afb-8efc-81618fdc8170
7e0096bd-864e-4bb8-9e2b-6baf52a83a53	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 10:53:06.463165	118d280b-f01f-4afb-8efc-81618fdc8170
88976a0b-5228-4aee-a9aa-2c91ece19f2a	admin_gift	{"type":"usdt_withdrawal","label":"💸 משיכת 100.0000 USDT אושרה → TRcWghysJ8fjSbzV4zDue3MjF3fXxRCdL8","language":"he"}	f	2026-06-07 10:54:25.303788	118d280b-f01f-4afb-8efc-81618fdc8170
06ed07ee-8abc-4724-9aa0-0b782fb42336	shield_expired	{}	f	2026-06-07 11:24:17.193557	0d5907f3-6feb-44c6-8f4f-43687783261f
d857c8f0-a826-49eb-b186-55cc740f767d	attacked	{"attackerName":"🏰 Melech","gold":0,"wood":0,"won":false,"telegramId":"647720443"}	f	2026-06-07 11:25:45.143033	01271206-b687-44cb-a820-612b7ddc6593
92a2eec1-1085-45c5-a7ff-216e656af27f	admin_gift	{"type":"gems","amount":20,"label":"💎 Gems ×20","language":"he"}	f	2026-06-07 11:27:34.235202	118d280b-f01f-4afb-8efc-81618fdc8170
66dc3adb-ad02-4ff9-8c26-e8ad4066e1aa	admin_gift	{"type":"usdt","amount":20,"label":"💵 USDT ×20","language":"he"}	f	2026-06-07 11:29:45.637071	118d280b-f01f-4afb-8efc-81618fdc8170
62d5af3f-1399-4e16-972f-2fd291edbf0b	admin_gift	{"type":"usdt_withdrawal_rejected","label":"❌ בקשת משיכה נדחתה: בדיקה","language":"he"}	f	2026-06-07 11:34:11.155172	118d280b-f01f-4afb-8efc-81618fdc8170
7191bbcc-43ee-4c09-9b9a-a518e89754bf	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 11:50:37.29595	118d280b-f01f-4afb-8efc-81618fdc8170
bcbd3377-76eb-43a6-9f26-70f7bd5e5d22	withdrawal_rejected	{"reason":": בדיקה","language":"he"}	f	2026-06-07 11:51:21.902116	118d280b-f01f-4afb-8efc-81618fdc8170
44b38e6b-4b21-4031-8de2-b19049b65c6d	withdrawal_rejected	{"reason":": חיעחיעעי","language":"he"}	f	2026-06-07 11:52:21.146685	118d280b-f01f-4afb-8efc-81618fdc8170
39590070-e0ec-46ac-b16f-85c349c05e1d	admin_gift	{"type":"usdt","amount":1000,"label":"💵 USDT ×1000","language":"he"}	f	2026-06-07 11:53:20.045565	0d5907f3-6feb-44c6-8f4f-43687783261f
e2f280c0-6437-4f1f-bba4-8cb2a00f961f	attacked	{"attackerName":"🏰 kwi","gold":635,"wood":505,"won":true,"telegramId":"928045648"}	f	2026-06-07 11:57:22.473706	0d5907f3-6feb-44c6-8f4f-43687783261f
6a3dbe2e-bd72-480e-8016-68d7d4fe1ba7	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"en"}	f	2026-06-07 11:59:38.883996	894e2ff9-f989-4d35-af52-3c1ec8033b6d
a8687a55-dc68-49c0-9fb1-4df5652f0d8e	attacked	{"attackerName":"🏰 kwi","gold":467,"wood":389,"won":true,"telegramId":"7234567890"}	f	2026-06-07 12:01:52.649734	894e2ff9-f989-4d35-af52-3c1ec8033b6d
c30a87b8-8e5c-408f-89c9-0c8d8e14c5f6	admin_gift	{"type":"gems","amount":1000,"label":"💎 Gems ×1000","language":"en"}	f	2026-06-07 12:06:46.658898	01271206-b687-44cb-a820-612b7ddc6593
aff3a97f-9b96-490d-9c64-1cf59c04d546	admin_gift	{"type":"gold","amount":10000,"label":"💰 זהב ×10000","language":"en"}	f	2026-06-07 12:06:57.091735	01271206-b687-44cb-a820-612b7ddc6593
ed4f3ed0-2ebe-4057-8e90-1ec9045b5227	admin_gift	{"type":"wood","amount":10000,"label":"🪵 עץ ×10000","language":"en"}	f	2026-06-07 12:07:06.886416	01271206-b687-44cb-a820-612b7ddc6593
2f68e376-4bf2-4190-966a-04f593293251	admin_gift	{"type":"food","amount":10000,"label":"🌾 אוכל ×10000","language":"en"}	f	2026-06-07 12:07:35.565113	01271206-b687-44cb-a820-612b7ddc6593
e1db8abe-a2f4-4479-8ed5-081b60dbb389	admin_gift	{"type":"usdt","amount":1000,"label":"💵 USDT ×1000","language":"en"}	f	2026-06-07 12:15:18.664027	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
6c01d749-6ef7-423d-97d3-3f01808264e0	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-07 12:33:38.541764	0d5907f3-6feb-44c6-8f4f-43687783261f
11a2408e-9137-48d6-9be1-a148afa1d803	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6469663868"}	f	2026-06-07 12:45:28.872708	02f52ce4-587a-4cfb-91a8-da93a1668820
730a80de-67ac-4b5e-b7d7-f34d29588cf9	shield_expired	{}	f	2026-06-07 13:24:35.664146	0d5907f3-6feb-44c6-8f4f-43687783261f
66a48da6-41c5-4fcc-9c77-08544331ed59	shield_expired	{}	f	2026-06-07 14:47:42.043571	01271206-b687-44cb-a820-612b7ddc6593
37968cb4-38fd-4c3c-a9d6-3b4386244439	attacked	{"attackerName":"מנשה's Kingdom","gold":442,"wood":370,"won":true,"telegramId":"7234567890"}	f	2026-06-07 14:48:57.22871	894e2ff9-f989-4d35-af52-3c1ec8033b6d
57d1f5ca-2757-442c-af43-bd03006394ce	training_done	{"telegramId":"647720443","language":"en","unit":"swordsman","count":1}	f	2026-06-07 14:50:42.005527	01271206-b687-44cb-a820-612b7ddc6593
47e02743-ca10-4e67-ad6a-a067b694adb4	training_done	{"unit":"swordsman","count":1}	f	2026-06-07 14:50:42.044702	01271206-b687-44cb-a820-612b7ddc6593
1d08903e-8f53-497a-93bf-27d6fe0ff8f9	build_done	{"telegramId":"647720443","language":"en","building":"farm","level":4,"count":1}	f	2026-06-07 14:51:40.781573	01271206-b687-44cb-a820-612b7ddc6593
8bd635fc-e1b9-4669-87ea-5c171b5a816c	build_done	{"telegramId":"647720443","language":"en","building":"gold_mine","level":3,"count":1}	f	2026-06-07 14:51:40.80143	01271206-b687-44cb-a820-612b7ddc6593
10b55634-1f13-4d6d-82d3-b524ed1a0e41	build_done	{"telegramId":"647720443","language":"en","building":"lumber_mill","level":4,"count":1}	f	2026-06-07 14:51:40.81769	01271206-b687-44cb-a820-612b7ddc6593
e8c78138-baf1-405e-a43c-76ac6b81eb29	build_done	{"telegramId":"647720443","language":"en","building":"stone_quarry","level":3,"count":1}	f	2026-06-07 14:51:40.835437	01271206-b687-44cb-a820-612b7ddc6593
e77e348a-39db-4c9d-968a-b265cd73daad	build_done	{"building":"farm","level":4,"count":1}	f	2026-06-07 14:51:40.839699	01271206-b687-44cb-a820-612b7ddc6593
410fd497-dafe-4cb4-9a63-93696fb2379b	build_done	{"building":"gold_mine","level":3,"count":1}	f	2026-06-07 14:51:40.845714	01271206-b687-44cb-a820-612b7ddc6593
4a02a013-46e9-4b80-a91c-77048509bd4b	build_done	{"building":"lumber_mill","level":4,"count":1}	f	2026-06-07 14:51:40.85973	01271206-b687-44cb-a820-612b7ddc6593
46e4d9e0-20ab-4170-8b28-0b7a50707930	build_done	{"building":"stone_quarry","level":3,"count":1}	f	2026-06-07 14:51:40.861704	01271206-b687-44cb-a820-612b7ddc6593
459c60a6-0169-41c6-a0be-447d5ba2655f	build_done	{"telegramId":"647720443","language":"en","building":"barracks","level":4,"count":1}	f	2026-06-07 14:52:42.02838	01271206-b687-44cb-a820-612b7ddc6593
4f31783d-7e21-49db-9f19-2c63f9bf3969	training_done	{"telegramId":"647720443","language":"en","unit":"archer","count":1}	f	2026-06-07 14:52:42.104834	01271206-b687-44cb-a820-612b7ddc6593
8437e15b-76b4-460a-92d3-a3ea346e3033	training_done	{"unit":"spearman","count":1}	f	2026-06-07 14:52:42.104621	01271206-b687-44cb-a820-612b7ddc6593
ebc60baa-9e3b-4bea-b49f-2056443e5704	build_done	{"building":"barracks","level":4,"count":1}	f	2026-06-07 14:52:42.105011	01271206-b687-44cb-a820-612b7ddc6593
08b3f4f5-125f-42ab-90d1-24b430e94641	training_done	{"telegramId":"647720443","language":"en","unit":"spearman","count":1}	f	2026-06-07 14:52:42.121356	01271206-b687-44cb-a820-612b7ddc6593
d54a5154-0297-41dd-a8ef-a2b822670ef7	attacked	{"attackerName":"מנשה's Kingdom","gold":750,"wood":600,"won":true,"telegramId":"418120178"}	f	2026-06-07 14:53:29.096704	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
c3a53ccc-5f31-4b05-8487-959587f984d5	build_done	{"telegramId":"647720443","language":"en","building":"town_hall","level":4,"count":1}	f	2026-06-07 14:53:42.021236	01271206-b687-44cb-a820-612b7ddc6593
0197f49e-61a3-4186-940c-2c92ea149e40	build_done	{"building":"town_hall","level":4,"count":1}	f	2026-06-07 14:53:42.06316	01271206-b687-44cb-a820-612b7ddc6593
32bfae9b-08c4-458f-93c4-7c477f638a9f	training_done	{"unit":"swordsman","count":2}	f	2026-06-07 14:53:42.070706	01271206-b687-44cb-a820-612b7ddc6593
f2402d43-8f57-4c8e-be1e-d3ccd604b38b	training_done	{"telegramId":"647720443","language":"en","unit":"swordsman","count":2}	f	2026-06-07 14:53:42.072893	01271206-b687-44cb-a820-612b7ddc6593
c09faca3-521e-451c-9be6-bda5641fdf11	training_done	{"unit":"cavalry","count":2}	f	2026-06-07 14:55:00.210932	01271206-b687-44cb-a820-612b7ddc6593
79a6979c-e3b6-4c5b-988e-1bfb5189cd09	build_done	{"telegramId":"647720443","language":"en","building":"wall","level":2,"count":1}	f	2026-06-07 15:33:36.896256	01271206-b687-44cb-a820-612b7ddc6593
baa5f6a4-835d-4979-b52c-6220558bb8fa	build_done	{"building":"wall","level":2,"count":1}	f	2026-06-07 15:33:36.923903	01271206-b687-44cb-a820-612b7ddc6593
cb3b6b96-1a7b-4815-a24e-eef360558fc7	attacked	{"attackerName":"מנשה's Kingdom","gold":0,"wood":0,"won":false,"telegramId":"6394982345"}	f	2026-06-07 15:35:02.080702	118d280b-f01f-4afb-8efc-81618fdc8170
1113a221-0c86-4b51-a1c6-a6c8c74657fd	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":3,"count":1}	f	2026-06-07 16:11:14.831865	118d280b-f01f-4afb-8efc-81618fdc8170
689d1020-3857-450f-a306-cf670bed6970	build_done	{"building":"farm","level":3,"count":1}	f	2026-06-07 16:11:14.866141	118d280b-f01f-4afb-8efc-81618fdc8170
390ad715-cf71-4835-9a1e-cfd3b5672a87	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 16:30:18.556347	894e2ff9-f989-4d35-af52-3c1ec8033b6d
d168fff9-04c9-4d6f-9ce6-8bb9fe89005e	shield_expired	{}	f	2026-06-07 16:40:09.920037	118d280b-f01f-4afb-8efc-81618fdc8170
765e766f-d1c7-4abf-b647-37f16052dbd0	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 16:46:28.920203	118d280b-f01f-4afb-8efc-81618fdc8170
55f64a61-ad76-40b4-8ce2-e8b28c21127e	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 16:46:49.808584	894e2ff9-f989-4d35-af52-3c1ec8033b6d
a1d5e5a0-eae0-462d-b125-8bbd4f41f8f7	admin_gift	{"type":"gems","amount":1,"label":"💎 Gems ×1","language":"en"}	f	2026-06-07 16:54:17.321636	894e2ff9-f989-4d35-af52-3c1ec8033b6d
02b640cc-ba13-456d-a885-753327a6c87e	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 17:03:01.274254	118d280b-f01f-4afb-8efc-81618fdc8170
fc215ae3-e79f-4b4e-9012-ce4132d46a6d	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 17:04:12.921767	118d280b-f01f-4afb-8efc-81618fdc8170
38c64b0f-d885-477b-b04f-a234919c44c5	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 17:04:55.46713	118d280b-f01f-4afb-8efc-81618fdc8170
1fb1c9f8-cbbf-43ab-8ae5-446ce5bb14af	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 17:05:13.37732	118d280b-f01f-4afb-8efc-81618fdc8170
09825510-53ab-454e-904e-6a982a922ec4	admin_gift	{"type":"gold","amount":100,"label":"💰 זהב ×100","language":"he"}	f	2026-06-07 17:05:53.547915	118d280b-f01f-4afb-8efc-81618fdc8170
c26488ca-20d5-431c-a209-b61fc6c6b1ff	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 17:06:01.679154	118d280b-f01f-4afb-8efc-81618fdc8170
a9bfff7f-b100-491f-88a6-7770252d045b	admin_gift	{"type":"wood","amount":100,"label":"🪵 עץ ×100","language":"he"}	f	2026-06-07 17:06:14.544982	118d280b-f01f-4afb-8efc-81618fdc8170
bc965449-517a-4f02-8468-6e204d6e60ec	admin_gift	{"type":"stone","amount":100,"label":"🪨 אבן ×100","language":"he"}	f	2026-06-07 17:06:38.456181	118d280b-f01f-4afb-8efc-81618fdc8170
12b0b601-b48c-4d35-9cf5-110d6e98b196	admin_gift	{"type":"food","amount":100,"label":"🌾 אוכל ×100","language":"he"}	f	2026-06-07 17:06:52.18279	118d280b-f01f-4afb-8efc-81618fdc8170
a9d9a367-a289-4e12-b5fd-a4198bb27b0d	admin_gift	{"type":"usdt","amount":1,"label":"💵 USDT ×1","language":"en"}	f	2026-06-07 17:07:41.946212	894e2ff9-f989-4d35-af52-3c1ec8033b6d
67976033-f9ba-4f1a-8b17-808021c83ef6	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"en"}	f	2026-06-07 17:08:18.542341	894e2ff9-f989-4d35-af52-3c1ec8033b6d
eaa754ab-b535-40ca-a72e-9ccef0f0fb84	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"en"}	f	2026-06-07 17:11:45.501542	894e2ff9-f989-4d35-af52-3c1ec8033b6d
adaa0374-37b0-4dd7-b448-66294f8dc6f8	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 17:12:09.411413	118d280b-f01f-4afb-8efc-81618fdc8170
af98719b-a608-44db-98bf-3c7fbb609cdd	admin_gift	{"type":"usdt","amount":50,"label":"💵 USDT ×50","language":"en"}	f	2026-06-07 19:17:32.484897	894e2ff9-f989-4d35-af52-3c1ec8033b6d
86e83df9-2ae7-4930-b480-a319e34d0e34	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"en"}	f	2026-06-07 19:30:15.770372	894e2ff9-f989-4d35-af52-3c1ec8033b6d
4a6ca5be-21e5-4ff9-9105-c724fea3b02a	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 19:30:55.876971	118d280b-f01f-4afb-8efc-81618fdc8170
8b69a694-08db-4644-b325-167a0905f9f0	admin_gift	{"type":"usdt","amount":20,"label":"💵 USDT ×20","language":"en"}	f	2026-06-07 19:32:06.758871	894e2ff9-f989-4d35-af52-3c1ec8033b6d
776cd12c-e28a-41f2-a5f7-7da8175ac068	admin_gift	{"type":"usdt","amount":15,"label":"💵 USDT ×15","language":"he"}	f	2026-06-07 19:34:50.272839	118d280b-f01f-4afb-8efc-81618fdc8170
cac756c0-8c1b-4647-89fb-f5592dbf1614	admin_gift	{"type":"gems","amount":1,"label":"💎 Gems ×1","language":"en"}	f	2026-06-07 19:39:30.673826	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
8300b8eb-cd85-4b14-91ee-18da77ffcf80	admin_gift	{"type":"gems","amount":5,"label":"💎 Gems ×5","language":"en"}	f	2026-06-07 19:42:04.334655	894e2ff9-f989-4d35-af52-3c1ec8033b6d
16941b22-e5d3-479f-8434-0dfc9959f903	admin_gift	{"type":"gems","amount":1,"label":"💎 Gems ×1","language":"he"}	f	2026-06-07 19:43:28.213855	c54f3d04-0339-4321-8c0e-6ee30041bf65
bc8c7046-e328-49a4-a1ad-b7f0cea323e4	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 19:44:40.312023	118d280b-f01f-4afb-8efc-81618fdc8170
fbe87d64-c025-406f-bcfe-e80fd6190756	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 19:46:30.078561	118d280b-f01f-4afb-8efc-81618fdc8170
ffde104b-4d63-4148-9a4b-7b0224824eab	admin_gift	{"type":"gems","amount":5,"label":"💎 Gems ×5","language":"he"}	f	2026-06-07 19:52:22.047511	c54f3d04-0339-4321-8c0e-6ee30041bf65
4b38770b-e433-42dc-b4ac-805aee0a1e8e	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 19:55:04.407111	118d280b-f01f-4afb-8efc-81618fdc8170
bd59459a-b70a-49c3-8622-99101c0b60cb	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"en"}	f	2026-06-07 19:57:35.427197	894e2ff9-f989-4d35-af52-3c1ec8033b6d
36b9d706-24db-44f9-b388-5c08a5e76f13	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"en"}	f	2026-06-07 19:59:22.567794	894e2ff9-f989-4d35-af52-3c1ec8033b6d
a66d3bb3-a30a-4fd0-8040-8c5c1910e522	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 20:00:27.022701	118d280b-f01f-4afb-8efc-81618fdc8170
f4161246-d682-4205-ab16-110244bfcdda	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 20:00:31.783292	894e2ff9-f989-4d35-af52-3c1ec8033b6d
2fc3e432-0621-4ce1-951e-e4abe685aaa3	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-07 20:00:54.479141	c54f3d04-0339-4321-8c0e-6ee30041bf65
55a5fb1e-e68f-4fa0-ad43-3819a0ea9f9f	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-07 20:04:05.968339	c54f3d04-0339-4321-8c0e-6ee30041bf65
a5e8d356-0296-42a8-8150-5a023374b083	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"he"}	f	2026-06-07 20:04:05.988349	c54f3d04-0339-4321-8c0e-6ee30041bf65
8c21d72b-68e7-4fca-9958-d41d17ccd8af	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 20:04:25.294131	894e2ff9-f989-4d35-af52-3c1ec8033b6d
150327f5-c833-43cc-bc99-b1a44dbf9ae2	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 20:04:42.796616	118d280b-f01f-4afb-8efc-81618fdc8170
bda22acd-4052-4da2-85fb-7d2f899034e6	withdrawal_rejected	{"reason":": בדיקה","language":"he"}	f	2026-06-07 20:06:10.224163	118d280b-f01f-4afb-8efc-81618fdc8170
16fd43e7-7073-40b4-9141-cc724d60f0d5	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 20:07:10.00904	118d280b-f01f-4afb-8efc-81618fdc8170
a92699c6-0f91-4ac7-8649-f55b3a49ed8f	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 20:07:50.500984	118d280b-f01f-4afb-8efc-81618fdc8170
b0007c98-a55e-4dcc-915c-1594c476d2eb	admin_gift	{"type":"gems","amount":1,"label":"💎 Gems ×1","language":"he"}	f	2026-06-07 20:09:51.115177	118d280b-f01f-4afb-8efc-81618fdc8170
1534994c-d04b-4e05-ac7c-183a5b9c9d86	admin_gift	{"type":"gems","amount":50,"label":"💎 Gems ×50","language":"he"}	f	2026-06-07 20:12:11.827763	118d280b-f01f-4afb-8efc-81618fdc8170
6acb875e-f6ac-4ca8-8526-fb61c46f24b2	admin_gift	{"type":"gems","amount":1,"label":"💎 Gems ×1","language":"he"}	f	2026-06-07 20:14:23.963104	118d280b-f01f-4afb-8efc-81618fdc8170
1a3ce10d-90e9-433a-ae52-dc32678cd842	admin_gift	{"type":"gems","amount":5,"label":"💎 Gems ×5","language":"he"}	f	2026-06-07 20:15:51.198785	118d280b-f01f-4afb-8efc-81618fdc8170
132e53b8-a402-4829-9755-32aa6fa03c4c	admin_gift	{"type":"gold","amount":100,"label":"💰 זהב ×100","language":"he"}	f	2026-06-07 20:16:14.24668	118d280b-f01f-4afb-8efc-81618fdc8170
02f8f085-2f46-42ab-b543-4263328a19c8	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 20:16:24.147897	118d280b-f01f-4afb-8efc-81618fdc8170
f57e9947-5e68-4cc4-9604-a8e1e4430c75	admin_gift	{"type":"gold","amount":100,"label":"💰 זהב ×100","language":"he"}	f	2026-06-07 20:22:04.840434	118d280b-f01f-4afb-8efc-81618fdc8170
e04696e9-2194-4a5a-aa95-65014a8bd7f5	build_done	{"telegramId":"6394982345","language":"he","building":"stone_quarry","level":2,"count":1}	f	2026-06-07 20:24:26.611629	118d280b-f01f-4afb-8efc-81618fdc8170
d5444fb4-bf39-4b84-8509-a91b397d545e	build_done	{"building":"stone_quarry","level":2,"count":1}	f	2026-06-07 20:24:26.651693	118d280b-f01f-4afb-8efc-81618fdc8170
495ac958-2325-4449-bfb8-0410885d6749	training_done	{"telegramId":"6394982345","language":"he","unit":"spearman","count":1}	f	2026-06-07 20:26:43.551092	118d280b-f01f-4afb-8efc-81618fdc8170
edf23a33-ad79-4479-a771-3496316ff7ec	training_done	{"unit":"spearman","count":1}	f	2026-06-07 20:26:43.580741	118d280b-f01f-4afb-8efc-81618fdc8170
98682a47-5e5f-443c-9b02-9964052793f7	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-07 20:31:09.907759	118d280b-f01f-4afb-8efc-81618fdc8170
754ef6ee-d43f-499e-9776-c3f075e8b66f	admin_gift	{"type":"gold","amount":100,"label":"💰 זהב ×100","language":"he"}	f	2026-06-07 20:31:17.169547	118d280b-f01f-4afb-8efc-81618fdc8170
d38aec3d-9b37-4512-a22c-2d8ecb284a1e	admin_gift	{"type":"wood","amount":100,"label":"🪵 עץ ×100","language":"he"}	f	2026-06-07 20:31:24.593634	118d280b-f01f-4afb-8efc-81618fdc8170
10dbba08-211e-48e7-84b6-3da923ce50aa	admin_gift	{"type":"stone","amount":100,"label":"🪨 אבן ×100","language":"he"}	f	2026-06-07 20:31:30.397975	118d280b-f01f-4afb-8efc-81618fdc8170
e6eabe95-8745-4f36-b776-243f8e24c4ad	admin_gift	{"type":"food","amount":100,"label":"🌾 אוכל ×100","language":"he"}	f	2026-06-07 20:31:35.736567	118d280b-f01f-4afb-8efc-81618fdc8170
83a77ea6-aa44-403e-aa7a-194ac1b55d2e	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"he"}	f	2026-06-07 20:31:43.072585	118d280b-f01f-4afb-8efc-81618fdc8170
b33812a9-2b81-4fcc-8a9c-273cb2872f78	build_done	{"building":"stone_quarry","level":2,"count":1}	f	2026-06-07 20:37:14.092716	118d280b-f01f-4afb-8efc-81618fdc8170
a44f3c59-ee77-43c7-ae6d-3fb5a2000adf	training_done	{"unit":"spearman","count":1}	f	2026-06-07 20:37:14.093937	118d280b-f01f-4afb-8efc-81618fdc8170
daf9b9a5-5a4a-41a8-9a49-05d91c4b43e4	training_done	{"unit":"swordsman","count":1}	f	2026-06-07 20:37:14.099706	118d280b-f01f-4afb-8efc-81618fdc8170
4daee677-6d7c-41b3-91f1-e413dc1dfa7b	training_done	{"unit":"swordsman","count":1}	f	2026-06-07 20:41:38.286692	118d280b-f01f-4afb-8efc-81618fdc8170
48367227-eb2d-425c-bbc8-ea19d97b65ef	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"he"}	f	2026-06-07 20:42:52.128077	118d280b-f01f-4afb-8efc-81618fdc8170
3c878c83-17bc-471e-a0e9-9d6d8ce3d8c3	training_done	{"unit":"spearman","count":1}	f	2026-06-07 20:44:38.549825	118d280b-f01f-4afb-8efc-81618fdc8170
1ac6c8cc-2a86-4773-88da-732a9ad95756	training_done	{"unit":"swordsman","count":1}	f	2026-06-07 20:44:38.547847	118d280b-f01f-4afb-8efc-81618fdc8170
9e158f57-b91e-48e2-83c4-7f0916a8d8a8	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 20:45:38.813056	894e2ff9-f989-4d35-af52-3c1ec8033b6d
91a7979a-563a-4837-b7b4-f802bacfb199	admin_gift	{"type":"usdt","amount":2,"label":"💵 USDT ×2","language":"he"}	f	2026-06-07 20:56:17.727827	118d280b-f01f-4afb-8efc-81618fdc8170
cbce8e16-6b07-4464-968c-f0dfcf46499f	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"en"}	f	2026-06-07 21:14:03.617299	894e2ff9-f989-4d35-af52-3c1ec8033b6d
0f1d6250-72cc-4d67-b837-a41ec2bfe3b3	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6469663868","language":"en"}	f	2026-06-08 03:34:38.829506	02f52ce4-587a-4cfb-91a8-da93a1668820
c5d649c6-8fc0-4cbb-b755-8833d8561652	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-08 03:38:28.785249	118d280b-f01f-4afb-8efc-81618fdc8170
620ec132-a544-4dde-9451-e37582d4bd1d	admin_gift	{"type":"usdt","amount":2,"label":"💵 USDT ×2","language":"he"}	f	2026-06-08 06:17:25.489291	118d280b-f01f-4afb-8efc-81618fdc8170
0f577786-8567-44a6-a375-519b37ce0ff4	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-08 06:18:21.472376	118d280b-f01f-4afb-8efc-81618fdc8170
9d5ebdba-cd44-4a7b-9d82-5d7e2b81eb9c	admin_gift	{"type":"usdt","amount":5,"label":"💵 USDT ×5","language":"he"}	f	2026-06-08 06:18:46.320675	118d280b-f01f-4afb-8efc-81618fdc8170
b0c5bd04-dffe-4c07-90af-5608adc9fe36	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"en"}	f	2026-06-08 06:51:04.827058	894e2ff9-f989-4d35-af52-3c1ec8033b6d
91676b75-d19b-4f50-bfc6-b3a848b3cf9e	attacked	{"attackerName":"🏰 kwi","gold":636,"wood":547,"won":true,"telegramId":"7234567890","language":"en"}	f	2026-06-08 06:52:09.624442	894e2ff9-f989-4d35-af52-3c1ec8033b6d
04f2ee10-183d-40bb-97f2-2ef811f0ec96	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-08 07:28:27.227412	c54f3d04-0339-4321-8c0e-6ee30041bf65
1e14d8b9-7762-479e-b180-88e9675d0494	admin_gift	{"type":"gold","amount":1000,"label":"💰 זהב ×1000","language":"he"}	f	2026-06-08 07:28:42.054371	c54f3d04-0339-4321-8c0e-6ee30041bf65
40780525-765e-4bd6-856e-efd21fb817f8	admin_gift	{"type":"wood","amount":1000,"label":"🪵 עץ ×1000","language":"he"}	f	2026-06-08 07:28:53.473413	c54f3d04-0339-4321-8c0e-6ee30041bf65
e2a93b5a-99c4-49d3-978c-0b9bdb440902	admin_gift	{"type":"stone","amount":1000,"label":"🪨 אבן ×1000","language":"he"}	f	2026-06-08 07:29:03.347468	c54f3d04-0339-4321-8c0e-6ee30041bf65
6c481c41-c296-493a-a415-06ce5e0d5b0c	admin_gift	{"type":"food","amount":1000,"label":"🌾 אוכל ×1000","language":"he"}	f	2026-06-08 07:29:13.266073	c54f3d04-0339-4321-8c0e-6ee30041bf65
cc6264ec-b916-4179-b7bc-b1e6714aa8cf	training_done	{"telegramId":"6575079418","language":"he","unit":"archer","count":1}	f	2026-06-08 07:48:46.415167	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
4ac0ecc1-7d44-472b-a6b1-1959e697d346	training_done	{"telegramId":"6575079418","language":"he","unit":"spearman","count":2}	f	2026-06-08 07:48:46.431293	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
b6152067-4790-4a2e-bae6-37e4b4144949	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":2,"count":1}	f	2026-06-08 07:50:00.020235	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
1344e4fa-895f-4042-908a-185986d1c6c4	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":2,"count":1}	f	2026-06-08 07:50:00.054345	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e8ebb866-3477-49bd-a7dc-feea7f7ccbdd	training_done	{"telegramId":"6575079418","language":"he","unit":"spearman","count":1}	f	2026-06-08 07:53:06.537412	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
b35870cd-f9a7-4d12-9909-4c822eeac9bc	admin_gift	{"type":"gems","amount":200,"label":"💎 Gems ×200","language":"he"}	f	2026-06-08 07:53:07.138697	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
8e989eea-3f82-4635-bf9d-b3c87b427228	admin_gift	{"type":"gold","amount":1000,"label":"💰 זהב ×1000","language":"he"}	f	2026-06-08 07:53:15.296515	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
87278700-8947-46e9-8cb5-2f3f49772737	admin_gift	{"type":"wood","amount":1000,"label":"🪵 עץ ×1000","language":"he"}	f	2026-06-08 07:53:22.507031	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
159c185a-1a77-4c0b-9e58-04d477ae0586	admin_gift	{"type":"stone","amount":1000,"label":"🪨 אבן ×1000","language":"he"}	f	2026-06-08 07:53:30.05933	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
f2cbd047-ef11-448b-a5d9-f2cf30d7e596	admin_gift	{"type":"food","amount":1000,"label":"🌾 אוכל ×1000","language":"he"}	f	2026-06-08 07:53:36.016036	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9265368f-b578-441f-a2a3-818c93ad6b52	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":2,"count":1}	f	2026-06-08 07:55:08.847308	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
4b319ad1-f94e-4ab6-8299-6b8a1cb294b3	build_done	{"telegramId":"6575079418","language":"he","building":"barracks","level":2,"count":1}	f	2026-06-08 07:56:08.839571	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
0af19e2c-4928-4af2-8d4b-f1c365511774	training_done	{"telegramId":"6575079418","language":"he","unit":"archer","count":1}	f	2026-06-08 07:56:08.850945	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
58d01286-ba6e-4916-87d9-9377b76cec8c	training_done	{"telegramId":"6575079418","language":"he","unit":"spearman","count":11}	f	2026-06-08 07:58:34.376695	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
64962a66-a411-41df-aeb9-5f29458aaec4	training_done	{"telegramId":"6575079418","language":"he","unit":"archer","count":1}	f	2026-06-08 07:58:34.380351	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
dda396a0-836d-43ad-be5a-08ce52672649	attacked	{"attackerName":"🦁 AdaMic","gold":1500,"wood":1200,"won":true,"telegramId":"418120178","language":"en"}	f	2026-06-08 07:59:37.396755	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
0814aaa6-e313-4af0-8fe4-d63c3b0ad58b	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"373450154","language":"en"}	f	2026-06-08 08:00:48.781147	6bf59c72-777f-4166-8d45-5a57721d6c49
973d3ec0-0901-4062-bc9b-9ddfe627866d	build_done	{"telegramId":"6575079418","language":"he","building":"town_hall","level":2,"count":1}	f	2026-06-08 08:05:00.052693	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
71047bc7-17ad-41b3-8734-0c6caa809a85	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":3,"count":1}	f	2026-06-08 08:05:00.131291	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
3f1a0fe6-6b44-48c0-868f-bde9ae743048	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":2,"count":1}	f	2026-06-08 08:05:00.128739	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
075f5b89-d662-4e3d-80e1-b0fe7d0e8ce8	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":3,"count":1}	f	2026-06-08 08:05:00.134712	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
23184602-9d17-4607-ae2b-73574a92e50c	training_done	{"telegramId":"6575079418","language":"he","unit":"archer","count":12}	f	2026-06-08 08:05:00.137711	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
080abeee-6592-4011-8053-378567ed44c2	attacked	{"attackerName":"🦁 AdaMic","gold":561,"wood":483,"won":true,"telegramId":"7234567890","language":"en"}	f	2026-06-08 08:09:38.717914	894e2ff9-f989-4d35-af52-3c1ec8033b6d
f12ebddd-4bdc-4735-bbd3-ba9fab6506aa	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":3,"count":1}	f	2026-06-08 08:09:40.159963	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
2c1d253d-0abe-41f6-b14a-e61705e930a9	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":4,"count":1}	f	2026-06-08 08:09:40.160705	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9c953250-ce66-46fa-9cd1-c7da360e4a67	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":3,"count":1}	f	2026-06-08 08:09:40.17654	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
815d80ce-1ee1-4833-ae2e-94565aeb1ca4	attacked	{"attackerName":"🦁 AdaMic","gold":716,"wood":572,"won":true,"telegramId":"6469663868","language":"en"}	f	2026-06-08 08:10:24.788512	02f52ce4-587a-4cfb-91a8-da93a1668820
9b001e19-2aef-4727-a2c3-94b28c806651	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":2,"count":1}	f	2026-06-08 08:11:37.965198	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
46dd3a06-0b50-41e0-b97f-77a6cd17dbe5	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":2,"count":1}	f	2026-06-08 08:11:37.971691	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
5c5c055b-c4e2-4ac9-9b56-1bbc10583bc4	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":3,"count":1}	f	2026-06-08 08:13:36.205203	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
67962e65-5f47-41e3-a6d5-f7080f36ddeb	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"928045648","language":"he"}	f	2026-06-08 08:14:04.288998	0d5907f3-6feb-44c6-8f4f-43687783261f
ba171ef9-11a7-44aa-b326-7b6ca3692cfc	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"6732523149","language":"en"}	f	2026-06-08 08:14:54.547712	a1dedbf4-4444-485e-bb47-ab46e9f96928
787bcf93-8ebc-4af2-83e6-0c844847157a	build_done	{"telegramId":"6575079418","language":"he","building":"barracks","level":3,"count":1}	f	2026-06-08 08:17:36.228272	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9028756a-18a7-4530-99fc-8670ac29eb80	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":3,"count":1}	f	2026-06-08 08:19:36.205809	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
0d260800-c49b-43bb-8180-9b20778969ed	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":4,"count":1}	f	2026-06-08 08:25:00.020279	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9b3e29ba-8f69-47fd-a7fa-3c41b6f13492	training_done	{"telegramId":"6575079418","language":"he","unit":"swordsman","count":11}	f	2026-06-08 08:25:00.047323	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
5efedd18-acc3-42f8-9230-275fc7ad5d51	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-08 09:00:57.366351	118d280b-f01f-4afb-8efc-81618fdc8170
12fffaf3-2f8c-4b78-9467-43518699c75f	admin_gift	{"type":"usdt","amount":3,"label":"💵 USDT ×3","language":"he"}	f	2026-06-08 09:22:13.227353	118d280b-f01f-4afb-8efc-81618fdc8170
ace73dff-0d20-4d23-8653-2a481e88cf69	attacked	{"attackerName":"🏰 kwi","gold":1153,"wood":960,"won":true,"telegramId":"647720443","language":"en"}	f	2026-06-08 09:28:48.649106	01271206-b687-44cb-a820-612b7ddc6593
024a1005-76eb-41e3-bdb7-2e8ea68c0365	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-08 09:29:43.790477	118d280b-f01f-4afb-8efc-81618fdc8170
617957e3-6ee4-45a2-b36f-f3caf707a72e	attacked	{"attackerName":"🏰 kwi","gold":500,"wood":431,"won":true,"telegramId":"7234567890","language":"en"}	f	2026-06-08 09:31:34.720241	894e2ff9-f989-4d35-af52-3c1ec8033b6d
c9d1a50c-de62-40d5-9ac3-8bdd7da10cc0	build_done	{"telegramId":"6394982345","language":"he","building":"gold_mine","level":4,"count":5}	f	2026-06-08 09:44:14.931739	118d280b-f01f-4afb-8efc-81618fdc8170
5a1cdff3-2f26-4696-ac50-3aa9c64cb4e6	attacked	{"attackerName":"🏰 kwi","gold":639,"wood":510,"won":true,"telegramId":"6469663868","language":"en"}	f	2026-06-08 09:59:32.479574	02f52ce4-587a-4cfb-91a8-da93a1668820
ade8db99-5559-4eac-942e-b4aa3e6123d9	attacked	{"attackerName":"🏰 kwi","gold":696,"wood":556,"won":true,"telegramId":"6732523149","language":"en"}	f	2026-06-08 11:35:49.733636	a1dedbf4-4444-485e-bb47-ab46e9f96928
5e7ea9b8-fedc-4b18-94e5-0e32ba2e57d7	admin_gift	{"type":"usdt","amount":100,"label":"💵 USDT ×100","language":"en"}	f	2026-06-08 11:43:11.80433	a1dedbf4-4444-485e-bb47-ab46e9f96928
0b42abf8-9470-4666-8743-907a944cd047	withdrawal_rejected	{"reason":": לך קיבינימט","language":"he"}	f	2026-06-08 11:46:11.801059	a1dedbf4-4444-485e-bb47-ab46e9f96928
d130eb9d-aa02-4001-8978-7556f6d0a083	attacked	{"attackerName":"🦁 AdaMic","gold":704,"wood":563,"won":true,"telegramId":"928045648","language":"he"}	f	2026-06-08 12:06:44.91232	0d5907f3-6feb-44c6-8f4f-43687783261f
ff0b2a86-7a4e-41c1-9d71-9c841ef3362e	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":4,"count":1}	f	2026-06-08 12:07:58.354164	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
56211184-8441-4c8d-8f16-b99fbb07a962	build_done	{"telegramId":"6575079418","language":"he","building":"hospital","level":2,"count":1}	f	2026-06-08 12:08:57.12988	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
728be8b1-f42c-4265-a90b-588f74998b38	build_done	{"telegramId":"6575079418","language":"he","building":"barracks","level":4,"count":1}	f	2026-06-08 12:08:57.127701	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
787987fd-466e-48e7-8633-50b50b3b2673	attacked	{"attackerName":"🦁 AdaMic","gold":707,"wood":565,"won":true,"telegramId":"373450154","language":"en"}	f	2026-06-08 12:08:57.151704	6bf59c72-777f-4166-8d45-5a57721d6c49
7b416a49-c02b-4ca7-91e9-5cad08d23949	attacked	{"attackerName":"🦁 AdaMic","gold":596,"wood":476,"won":true,"telegramId":"418120178","language":"en"}	f	2026-06-08 12:09:45.319164	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
d24a48ee-0245-493e-ad7c-12eee2d97161	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":5,"count":1}	f	2026-06-08 12:15:00.130945	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
26078d49-dc26-482f-955f-cc2d66af86fc	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":4,"count":1}	f	2026-06-08 12:15:00.134717	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
690d6632-7817-4a77-a26f-7cff7ff67625	training_done	{"telegramId":"6575079418","language":"he","unit":"cavalry","count":12}	f	2026-06-08 12:30:00.102904	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
a8121054-9669-4489-906d-9299a6c1ba97	attacked	{"attackerName":"🏰 kwi","gold":1092,"wood":918,"won":true,"telegramId":"647720443","language":"en"}	f	2026-06-08 14:35:00.806721	01271206-b687-44cb-a820-612b7ddc6593
22d61e10-4f58-4dec-9fa9-cbfb50e8c6e5	training_done	{"telegramId":"6394982345","language":"he","unit":"archer","count":11}	f	2026-06-08 14:40:19.981192	118d280b-f01f-4afb-8efc-81618fdc8170
4bde0f7e-cee9-4fab-afb3-f564246cba26	training_done	{"telegramId":"6394982345","language":"he","unit":"spearman","count":61}	f	2026-06-08 14:46:20.038136	118d280b-f01f-4afb-8efc-81618fdc8170
fa5f78b5-ee2f-4826-8c34-cb44e18727e5	build_done	{"telegramId":"6394982345","language":"he","building":"lumber_mill","level":2,"count":1}	f	2026-06-08 14:51:03.438034	118d280b-f01f-4afb-8efc-81618fdc8170
63c1e617-d989-4039-be35-1372399a3056	training_done	{"telegramId":"6394982345","language":"he","unit":"cavalry","count":11}	f	2026-06-08 14:51:03.441147	118d280b-f01f-4afb-8efc-81618fdc8170
e913ab20-e6f0-43d9-841c-6d3d5290f17b	training_done	{"telegramId":"6394982345","language":"he","unit":"swordsman","count":51}	f	2026-06-08 15:10:00.085135	118d280b-f01f-4afb-8efc-81618fdc8170
c39d6c1a-1f5d-44ff-a999-e0e8b2492141	training_done	{"telegramId":"6394982345","language":"he","unit":"catapult","count":11}	f	2026-06-08 15:15:00.068061	118d280b-f01f-4afb-8efc-81618fdc8170
9a467c7a-a5c5-48ec-a70d-4740c1ddba30	shield_expired	{"telegramId":"418120178","language":"en"}	f	2026-06-08 15:25:14.731434	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
b75c9816-9664-4a79-b860-60ede5dd9935	build_done	{"telegramId":"418120178","language":"en","building":"gold_mine","level":2,"count":1}	f	2026-06-08 15:27:05.115699	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
d6c88606-f620-4f78-abfc-674da6c8eeec	build_done	{"telegramId":"418120178","language":"en","building":"stone_quarry","level":2,"count":1}	f	2026-06-08 15:27:05.119053	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
fa8cf48a-08ba-4e11-950d-d5b8f7d2622a	build_done	{"telegramId":"418120178","language":"en","building":"farm","level":2,"count":1}	f	2026-06-08 15:27:05.122308	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
fb5c2ed5-7d00-4454-b3a5-1a3fac139004	build_done	{"telegramId":"418120178","language":"en","building":"lumber_mill","level":2,"count":1}	f	2026-06-08 15:27:05.11887	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
c77f10b9-68b7-41f9-8ed9-34917d1275a5	build_done	{"telegramId":"418120178","language":"en","building":"barracks","level":2,"count":1}	f	2026-06-08 15:30:00.064913	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
b569718c-bab6-4b26-b6d8-76c9ab85ee86	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":11}	f	2026-06-08 16:30:00.05392	118d280b-f01f-4afb-8efc-81618fdc8170
18850f00-df5c-476a-9eee-1928f8452379	shield_expired	{"telegramId":"647720443","language":"en"}	f	2026-06-08 21:24:56.444592	01271206-b687-44cb-a820-612b7ddc6593
a3f65c6a-18c1-40ab-a21b-f71c27d901e6	build_done	{"telegramId":"647720443","language":"en","building":"farm","level":3,"count":1}	f	2026-06-08 21:25:56.431405	01271206-b687-44cb-a820-612b7ddc6593
4e096efd-9f72-4c27-b014-ff9eb9ccb082	attacked	{"attackerName":"🏰 kwi","gold":417,"wood":637,"won":true,"telegramId":"647720443","language":"en"}	f	2026-06-08 21:26:20.44828	01271206-b687-44cb-a820-612b7ddc6593
9e90206e-6883-4b55-9daf-b97b5a7ff2f9	build_done	{"telegramId":"647720443","language":"en","building":"wall","level":3,"count":1}	f	2026-06-08 21:26:54.176612	01271206-b687-44cb-a820-612b7ddc6593
f824be83-eb45-475b-98a6-c0d6a75c4b69	training_done	{"telegramId":"647720443","language":"en","unit":"archer","count":1}	f	2026-06-08 21:26:54.184693	01271206-b687-44cb-a820-612b7ddc6593
c596f449-5ead-433f-9185-3b84988f976a	build_done	{"telegramId":"647720443","language":"en","building":"gold_mine","level":4,"count":1}	f	2026-06-08 21:26:54.182606	01271206-b687-44cb-a820-612b7ddc6593
11fad14b-9c7e-4fff-81a5-53b6cc91104b	training_done	{"telegramId":"647720443","language":"en","unit":"swordsman","count":1}	f	2026-06-08 21:26:54.180216	01271206-b687-44cb-a820-612b7ddc6593
a08701c3-7c8f-44e4-a5cc-ad50c21b222e	build_done	{"telegramId":"647720443","language":"en","building":"stone_quarry","level":2,"count":1}	f	2026-06-08 21:26:54.18068	01271206-b687-44cb-a820-612b7ddc6593
6675d294-2ca9-4465-865b-6faea99c1f68	training_done	{"telegramId":"647720443","language":"en","unit":"spearman","count":1}	f	2026-06-08 21:26:54.180589	01271206-b687-44cb-a820-612b7ddc6593
e82684b1-f484-41e9-90cf-7875e5cfe7be	training_done	{"telegramId":"647720443","language":"en","unit":"cavalry","count":1}	f	2026-06-08 21:27:52.441977	01271206-b687-44cb-a820-612b7ddc6593
4deb8447-00e2-410c-90a8-9be2047a2324	build_done	{"telegramId":"647720443","language":"en","building":"lumber_mill","level":5,"count":1}	f	2026-06-08 21:27:52.443701	01271206-b687-44cb-a820-612b7ddc6593
654f2d9b-fac3-4e98-acc6-317c7a871830	build_done	{"telegramId":"647720443","language":"en","building":"farm","level":4,"count":1}	f	2026-06-08 21:27:52.443809	01271206-b687-44cb-a820-612b7ddc6593
f3e195ac-3d72-4385-8cb0-1e8a75002505	build_done	{"telegramId":"647720443","language":"en","building":"gold_mine","level":5,"count":1}	f	2026-06-08 21:28:56.461288	01271206-b687-44cb-a820-612b7ddc6593
209be0f9-86e8-409f-9f5b-7f42ae999275	training_done	{"telegramId":"647720443","language":"en","unit":"spearman","count":1}	f	2026-06-08 21:28:56.512913	01271206-b687-44cb-a820-612b7ddc6593
cd3f7595-28b5-4bd5-affe-e143dd692aed	build_done	{"telegramId":"647720443","language":"en","building":"barracks","level":3,"count":1}	f	2026-06-08 21:28:56.5077	01271206-b687-44cb-a820-612b7ddc6593
4715c927-5ee4-4189-a572-15b5f6f0d9f2	build_done	{"telegramId":"647720443","language":"en","building":"wall","level":4,"count":1}	f	2026-06-08 21:28:56.511722	01271206-b687-44cb-a820-612b7ddc6593
db07c74a-fb4f-46e8-b1fc-80c029eed3fa	build_done	{"telegramId":"647720443","language":"en","building":"town_hall","level":5,"count":1}	f	2026-06-08 21:28:56.514495	01271206-b687-44cb-a820-612b7ddc6593
f70d3320-4e3d-4457-9b76-21f87e0ce8d5	build_done	{"telegramId":"647720443","language":"en","building":"stone_quarry","level":3,"count":1}	f	2026-06-08 21:28:56.516708	01271206-b687-44cb-a820-612b7ddc6593
31b85a15-806a-4a0f-8b3b-fd5a600eb87a	training_done	{"telegramId":"647720443","language":"en","unit":"spearman","count":1}	f	2026-06-08 21:30:00.022584	01271206-b687-44cb-a820-612b7ddc6593
baf395b6-e3ea-418f-88fb-bd3b6236c623	training_done	{"telegramId":"647720443","language":"en","unit":"swordsman","count":1}	f	2026-06-08 21:30:00.058096	01271206-b687-44cb-a820-612b7ddc6593
701c3c94-4a30-449a-972b-ed47755c28c9	training_done	{"telegramId":"647720443","language":"en","unit":"archer","count":1}	f	2026-06-08 21:30:00.06588	01271206-b687-44cb-a820-612b7ddc6593
755e6c55-004b-4c64-99cf-f3a2ac147386	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-09 08:50:37.764639	118d280b-f01f-4afb-8efc-81618fdc8170
74b46208-ca82-40ee-b0f0-88f04ecbb9f9	shield_expired	{"telegramId":"6394982345","language":"he"}	f	2026-06-09 15:59:32.739357	118d280b-f01f-4afb-8efc-81618fdc8170
2ef4b214-b7c9-469c-a3f8-6f1cf3f13e08	shield_expired	{"telegramId":"373450154","language":"en"}	f	2026-06-10 02:54:36.928636	6bf59c72-777f-4166-8d45-5a57721d6c49
3c83d52f-aa2c-434b-9f82-1c4a6316c9ca	training_done	{"telegramId":"6394982345","language":"he","unit":"spearman","count":1}	f	2026-06-10 03:21:01.56421	118d280b-f01f-4afb-8efc-81618fdc8170
64373198-e810-480d-b417-757e981d7b55	build_done	{"telegramId":"6394982345","language":"he","building":"lumber_mill","level":3,"count":1}	f	2026-06-10 03:21:01.571711	118d280b-f01f-4afb-8efc-81618fdc8170
ef6e23fa-ef18-4893-abab-cd35cf7d8c96	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"928045648","language":"he"}	f	2026-06-10 03:29:22.326838	0d5907f3-6feb-44c6-8f4f-43687783261f
895c39fb-f365-4268-8694-323f05e4d3f4	build_done	{"telegramId":"6575079418","language":"he","building":"hospital","level":3,"count":1}	f	2026-06-10 03:29:28.384161	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9eda5af8-c7c1-426b-b776-03eda7e68508	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":2,"count":2}	f	2026-06-10 03:29:28.402683	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
c2114549-1eae-4a61-a4f3-bcf418281bf5	build_done	{"telegramId":"6575079418","language":"he","building":"town_hall","level":3,"count":1}	f	2026-06-10 03:30:28.536685	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
3bf6bb86-587c-4e6b-a253-25088c2b52c2	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":5,"count":2}	f	2026-06-10 03:30:28.539582	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
4b5a3429-ab16-441b-9937-a06d75421c92	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":6,"count":1}	f	2026-06-10 03:35:00.048025	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
5aa06f8d-f985-46e2-b224-4c1df39e5f59	training_done	{"telegramId":"6575079418","language":"he","unit":"cavalry","count":22}	f	2026-06-10 04:00:00.163616	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
3a4c2ea6-f6f4-47ad-b445-f7eca0ddcc7a	build_done	{"telegramId":"6394982345","language":"he","building":"wall","level":5,"count":1}	f	2026-06-10 04:16:39.699558	118d280b-f01f-4afb-8efc-81618fdc8170
6e559f7b-e05e-47df-a414-cccff8dd8cf3	training_done	{"telegramId":"6394982345","language":"he","unit":"archer","count":2}	f	2026-06-10 04:26:50.546765	118d280b-f01f-4afb-8efc-81618fdc8170
fb0362bb-b51a-49b9-bbc0-bbe118dd3488	training_done	{"telegramId":"6394982345","language":"he","unit":"cavalry","count":51}	f	2026-06-10 04:28:49.741894	118d280b-f01f-4afb-8efc-81618fdc8170
a4fdc6ec-aee6-4ca3-af69-4cb5f65b6152	training_done	{"telegramId":"6394982345","language":"he","unit":"swordsman","count":102}	f	2026-06-10 04:28:49.746442	118d280b-f01f-4afb-8efc-81618fdc8170
98357203-d55a-4e76-b974-a979aadc524b	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":2}	f	2026-06-10 04:47:28.722581	118d280b-f01f-4afb-8efc-81618fdc8170
8c213b4d-e27a-4d02-875f-2b38ff4ccaa3	training_done	{"telegramId":"6394982345","language":"he","unit":"paladin","count":1}	f	2026-06-10 04:55:00.070332	118d280b-f01f-4afb-8efc-81618fdc8170
b25cb328-4517-4464-8b40-0fc210a2334c	training_done	{"telegramId":"6394982345","language":"he","unit":"swordsman","count":3}	f	2026-06-10 04:55:00.077362	118d280b-f01f-4afb-8efc-81618fdc8170
5b7b38a9-f432-4c5a-8609-7b65026a7b56	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":1}	f	2026-06-10 05:00:00.177181	118d280b-f01f-4afb-8efc-81618fdc8170
bd74f2a7-cd5d-4616-aa77-bf9fa13b5bfc	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6732523149","language":"he"}	f	2026-06-10 05:47:32.231291	a1dedbf4-4444-485e-bb47-ab46e9f96928
ce5465f8-e391-4a69-a078-b31bec4ee417	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6469663868","language":"en"}	f	2026-06-10 05:48:43.998095	02f52ce4-587a-4cfb-91a8-da93a1668820
1e47c595-4669-4af0-b353-56bff8153fcd	training_done	{"telegramId":"6394982345","language":"he","unit":"swordsman","count":35}	f	2026-06-10 06:10:00.093643	118d280b-f01f-4afb-8efc-81618fdc8170
6bf901da-3504-4286-9f87-afc29748a833	training_done	{"telegramId":"6394982345","language":"he","unit":"catapult","count":12}	f	2026-06-10 06:30:00.106477	118d280b-f01f-4afb-8efc-81618fdc8170
78bd9391-b6f0-468e-b55a-c6b97bae2e46	build_done	{"telegramId":"6394982345","language":"he","building":"wall","level":6,"count":1}	f	2026-06-10 12:28:14.334998	118d280b-f01f-4afb-8efc-81618fdc8170
034471c8-d644-461a-8dc2-a896e36f04a8	build_done	{"telegramId":"6394982345","language":"he","building":"hospital","level":7,"count":1}	f	2026-06-10 12:30:14.376621	118d280b-f01f-4afb-8efc-81618fdc8170
eb96cd74-8bca-4512-a331-ed689e6763c3	build_done	{"telegramId":"6394982345","language":"he","building":"barracks","level":11,"count":1}	f	2026-06-10 15:09:41.084481	118d280b-f01f-4afb-8efc-81618fdc8170
6c6c436c-bc5f-4fda-85e8-d483c7d47504	admin_gift	{"type":"gems","amount":10,"label":"💎 Gems ×10","language":"ru"}	f	2026-06-10 16:06:23.017434	d3fc6f10-5d93-4f88-978c-977963d7c74d
def74d3e-dbbb-4aa9-bf2c-9179d4f102d0	admin_gift	{"type":"gems","amount":10,"label":"💎 Gems ×10","language":"uz"}	f	2026-06-10 16:06:40.629399	73476f2f-7699-4fce-afe2-9eb20831f3b5
e51eaac6-5349-4d9c-b35a-8124d927bae9	admin_gift	{"type":"usdt","amount":20,"label":"💵 USDT ×20","language":"he"}	f	2026-06-10 16:13:47.308586	118d280b-f01f-4afb-8efc-81618fdc8170
cc19622c-ced0-4850-ae40-666d8e48ea77	build_done	{"telegramId":"6394982345","language":"he","building":"gem_forge","level":2,"count":1}	f	2026-06-10 16:49:36.332927	118d280b-f01f-4afb-8efc-81618fdc8170
83e69d93-eb33-41a4-8ca1-2122bb1d4ba4	training_done	{"telegramId":"6394982345","language":"he","unit":"titan","count":1}	f	2026-06-10 17:05:00.184703	118d280b-f01f-4afb-8efc-81618fdc8170
d8c121a0-b77b-4fdd-b810-958a9f2b6cff	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":2,"count":1}	f	2026-06-10 18:06:06.072121	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
8cf3edae-4d68-4582-b82f-06ad5cd34f2e	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":2,"count":1}	f	2026-06-10 18:06:06.075565	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
42687e6c-3d47-4add-8c06-0742af657402	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":5,"count":1}	f	2026-06-10 18:07:05.853697	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e7d5acbd-da0d-4097-84fa-3fc433c124b4	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"7234567890"}	f	2026-06-10 18:07:47.745233	894e2ff9-f989-4d35-af52-3c1ec8033b6d
8b32b622-239a-42df-baa5-c83ecddd26a1	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":3,"count":2}	f	2026-06-10 18:08:06.099381	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
2d6b32ea-c684-48eb-9339-df46a8813499	build_done	{"telegramId":"6575079418","language":"he","building":"barracks","level":5,"count":1}	f	2026-06-10 18:08:06.099315	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
787c026d-71ad-4c35-aeb3-33165a677f3b	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"6732523149"}	f	2026-06-10 18:08:55.019706	a1dedbf4-4444-485e-bb47-ab46e9f96928
0b49ca2c-04b0-44a0-924e-b0b51261a42b	build_done	{"telegramId":"6575079418","language":"he","building":"town_hall","level":4,"count":1}	f	2026-06-10 18:09:04.433768	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e5e60d4e-181a-41d0-933c-5ae8d2466d23	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":3,"count":1}	f	2026-06-10 18:09:04.436714	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
f1922707-5701-4709-84f5-8b2bbfcdf27d	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":4,"count":1}	f	2026-06-10 18:09:04.470286	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
aba06eb1-f8e2-4505-aa37-76a30afc0ebd	attacked	{"attackerName":"🦁 AdaMic","gold":1200,"wood":960,"won":true,"telegramId":"647720443"}	f	2026-06-10 18:09:43.801723	01271206-b687-44cb-a820-612b7ddc6593
3946811f-b1c1-4ada-b5f5-63ca78556b91	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":4,"count":1}	f	2026-06-10 18:10:05.985155	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
1699b866-a7f4-495e-94d8-5d3a935bf5f2	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":3,"count":1}	f	2026-06-10 18:10:06.000274	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
97db9ecd-7a2f-4172-9c7d-24cf6312696c	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":5,"count":1}	f	2026-06-10 18:12:05.985711	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
ecfcdc2f-110f-47c6-b341-72cfb6d28c2d	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":4,"count":1}	f	2026-06-10 18:12:05.985795	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
814580a6-7364-4272-9c26-61db8b8c0ede	build_done	{"telegramId":"6575079418","language":"he","building":"academy","level":2,"count":1}	f	2026-06-10 18:13:06.018311	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e10143c7-d819-4593-92e1-92d8c1d20d80	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"6469663868"}	f	2026-06-10 18:14:45.458212	02f52ce4-587a-4cfb-91a8-da93a1668820
e811edec-8918-4e89-861b-f03e226d448e	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":2,"count":1}	f	2026-06-10 18:18:33.881436	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
49b5b6fc-1020-49e6-beef-bba3f7246a75	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":3,"count":1}	f	2026-06-10 18:20:00.195991	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
d26ddb15-c21d-4e68-b79f-7ef1679f2278	training_done	{"telegramId":"6575079418","language":"he","unit":"catapult","count":4}	f	2026-06-10 18:30:00.170307	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
1831a482-78ca-4908-91d0-0e77077efd1e	build_done	{"telegramId":"6394982345","language":"ar","building":"lumber_mill","level":3,"count":1}	f	2026-06-10 20:05:00.050447	118d280b-f01f-4afb-8efc-81618fdc8170
12cddcc7-578b-4491-91ac-a083d7ac5980	build_done	{"telegramId":"6394982345","language":"en","building":"gem_forge","level":3,"count":1}	f	2026-06-10 22:04:16.977179	118d280b-f01f-4afb-8efc-81618fdc8170
c06cc17f-b580-4181-b35f-5e0023c29c93	build_done	{"telegramId":"6394982345","language":"en","building":"gold_mine","level":3,"count":1}	f	2026-06-10 22:15:03.682848	118d280b-f01f-4afb-8efc-81618fdc8170
9d716c41-8dee-44f3-bf4d-de00dd02ba05	training_done	{"telegramId":"6394982345","language":"he","unit":"titan","count":10}	f	2026-06-10 23:50:00.10702	118d280b-f01f-4afb-8efc-81618fdc8170
3c922a90-5c70-4494-baaa-5bbf41a8dbc5	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":9,"count":1}	f	2026-06-11 06:05:00.062841	118d280b-f01f-4afb-8efc-81618fdc8170
dd6167f5-9c6c-4b64-bf2a-7ff56adaf453	build_done	{"telegramId":"6575079418","language":"he","building":"town_hall","level":5,"count":1}	f	2026-06-11 06:23:21.785837	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
be02cefe-69b3-4822-bd4d-5abefdf72c67	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":30}	f	2026-06-11 10:47:54.13782	118d280b-f01f-4afb-8efc-81618fdc8170
64bde199-c644-4f99-bdba-1d01b3f77323	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":2,"count":1}	f	2026-06-11 10:48:54.190233	118d280b-f01f-4afb-8efc-81618fdc8170
85c2ecf9-6659-4807-b7df-b10853e8914a	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"373450154"}	f	2026-06-11 13:04:27.392194	6bf59c72-777f-4166-8d45-5a57721d6c49
0a57cdc4-e09d-4264-91f0-d1a9f24f2218	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6732523149"}	f	2026-06-11 13:40:55.788738	a1dedbf4-4444-485e-bb47-ab46e9f96928
c0bbff03-92ee-49f1-b2c3-4eb269eb1f6d	attacked	{"attackerName":"🏰 kwi","gold":1500,"wood":1200,"won":true,"telegramId":"6575079418"}	f	2026-06-11 23:02:11.906853	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
87da464a-5dda-49e5-bdea-7b57a1c755da	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"418120178"}	f	2026-06-11 23:04:32.066277	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
ad2edeeb-44f2-4958-b166-d55bbe98ee72	shield_expired	{"telegramId":"6575079418","language":"he"}	f	2026-06-12 03:49:15.420933	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
d01e9704-4877-44b8-b886-fc92a0b19d54	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":7,"count":1}	f	2026-06-12 03:55:00.066845	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
0e5e122b-ff0c-4f50-8ee5-44d620c87d23	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"415469240"}	f	2026-06-12 04:10:07.852472	c54f3d04-0339-4321-8c0e-6ee30041bf65
a0545b50-dcea-4c2a-900a-d4e3f1a03ab8	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"7723451677"}	f	2026-06-12 04:18:15.642704	fcb14d93-2053-4ac3-93e8-85ba2cd78717
c2d96345-be34-4411-ac82-73c6debbebce	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":2,"count":1}	f	2026-06-12 04:27:58.925712	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
3698700c-059b-44a3-ae5b-05fa7d5cb301	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":2,"count":1}	f	2026-06-12 04:27:58.925293	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
11127dbd-30f5-49b8-a35e-071b0ab99d8e	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":4,"count":1}	f	2026-06-12 04:27:58.946339	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
747fce42-2370-4e87-bfb1-2f64fa06789c	training_done	{"telegramId":"6394982345","language":"he","unit":"paladin","count":1}	f	2026-06-12 04:28:42.443713	118d280b-f01f-4afb-8efc-81618fdc8170
50e4286f-b471-4a4d-8564-9aa91f611628	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"6469663868"}	f	2026-06-12 04:30:49.310587	02f52ce4-587a-4cfb-91a8-da93a1668820
7a6abb9e-b1a6-4bdc-948b-799f9bd4e146	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":2,"count":1}	f	2026-06-12 04:29:01.121446	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
ab2d3d83-0a36-4039-ab2b-14f5988409f7	attacked	{"attackerName":"🏰 kwi","gold":750,"wood":600,"won":true,"telegramId":"7234567890"}	f	2026-06-12 04:30:39.414001	894e2ff9-f989-4d35-af52-3c1ec8033b6d
d7392b5f-b9cc-4868-9151-2f1961ee756e	training_done	{"telegramId":"6394982345","language":"he","unit":"dragon_rider","count":1}	f	2026-06-12 04:34:26.92413	118d280b-f01f-4afb-8efc-81618fdc8170
9c444eb7-00d1-433c-bee3-392cf0ac026f	training_done	{"telegramId":"6394982345","language":"he","unit":"titan","count":1}	f	2026-06-12 04:34:26.924206	118d280b-f01f-4afb-8efc-81618fdc8170
298b4b79-a25f-4cb9-9011-0aa131698943	training_done	{"telegramId":"6575079418","language":"he","unit":"cavalry","count":11}	f	2026-06-12 04:45:00.128713	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
f5c6446b-4b00-4745-a0d4-b790712d4f23	training_done	{"telegramId":"6394982345","language":"he","unit":"knight","count":1}	f	2026-06-12 05:23:55.928559	118d280b-f01f-4afb-8efc-81618fdc8170
2f73d4de-45ec-46ff-8fa9-fcd372072f0c	attacked	{"attackerName":"🏰 kwi","gold":2192,"wood":1753,"won":true,"telegramId":"7723451677"}	f	2026-06-12 05:27:31.256702	fcb14d93-2053-4ac3-93e8-85ba2cd78717
2d3252a8-bb68-4cd6-85aa-0914ae4b2666	attacked	{"attackerName":"🏰 kwi","gold":2500,"wood":2000,"won":true,"telegramId":"418120178"}	f	2026-06-12 05:27:39.185706	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
6bd49d17-eed5-4dba-84bc-f34616c6d8f6	attacked	{"attackerName":"🏰 kwi","gold":2182,"wood":1745,"won":true,"telegramId":"6469663868"}	f	2026-06-12 05:33:22.941276	02f52ce4-587a-4cfb-91a8-da93a1668820
2ed57178-eb8c-4e3a-9852-2463e1477cbf	admin_gift	{"type":"vip","amount":30,"label":"👑 VIP ל-30 ימים","language":"he"}	f	2026-06-12 05:42:35.034411	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
f19e7a3a-dfdf-4136-a001-e3f29dfeaa0a	build_done	{"telegramId":"6394982345","language":"he","building":"lumber_mill","level":5,"count":1}	f	2026-06-12 06:38:43.925237	118d280b-f01f-4afb-8efc-81618fdc8170
9105d348-4d74-4a83-be7f-26406e19dedc	build_done	{"telegramId":"6394982345","language":"he","building":"academy","level":7,"count":1}	f	2026-06-12 06:47:43.890746	118d280b-f01f-4afb-8efc-81618fdc8170
9bfcab43-c32a-4270-b799-b83b6cae7c60	build_done	{"telegramId":"6394982345","language":"he","building":"gold_mine","level":2,"count":1}	f	2026-06-12 08:18:51.704434	118d280b-f01f-4afb-8efc-81618fdc8170
84539dde-d168-4c53-bf00-d6d31b30f6a3	training_done	{"telegramId":"6394982345","language":"he","unit":"paladin","count":1}	f	2026-06-12 08:31:03.972477	118d280b-f01f-4afb-8efc-81618fdc8170
3556d4a6-235b-4264-bfd0-07ceed668c69	training_done	{"telegramId":"6394982345","language":"he","unit":"dragon_rider","count":1}	f	2026-06-12 08:35:00.148655	118d280b-f01f-4afb-8efc-81618fdc8170
bf4dfa35-0d78-4652-8af8-69fd928cd460	build_done	{"telegramId":"6394982345","language":"he","building":"barracks","level":12,"count":1}	f	2026-06-12 08:40:00.094709	118d280b-f01f-4afb-8efc-81618fdc8170
fd4d1c79-dfe9-4d1e-bf08-ff05347dd7c5	training_done	{"telegramId":"6394982345","language":"he","unit":"spearman","count":101}	f	2026-06-12 09:05:00.132021	118d280b-f01f-4afb-8efc-81618fdc8170
031b89c5-db12-48ad-9c23-d12313fd3eb3	attacked	{"attackerName":"🏰 kwi","gold":1309,"wood":1044,"won":true,"telegramId":"6469663868"}	f	2026-06-12 09:21:01.349711	02f52ce4-587a-4cfb-91a8-da93a1668820
5edfdc65-5abc-4b79-9d99-1e60c691e8b6	training_done	{"telegramId":"6394982345","language":"he","unit":"elite_guard","count":7}	f	2026-06-12 09:34:48.188707	118d280b-f01f-4afb-8efc-81618fdc8170
c75fe142-1bbc-4fb3-a632-a46c83670ee5	training_done	{"telegramId":"6394982345","language":"he","unit":"giant","count":1}	f	2026-06-12 09:37:47.885688	118d280b-f01f-4afb-8efc-81618fdc8170
df02f10d-0982-442d-8ffc-37a3910a6850	training_done	{"telegramId":"6394982345","language":"he","unit":"paladin","count":1}	f	2026-06-12 09:45:54.476703	118d280b-f01f-4afb-8efc-81618fdc8170
a54f3f85-d2b4-4e7c-99ba-f1bbb69bdb9f	attacked	{"attackerName":"🏰 kwi","gold":2408,"wood":1952,"won":true,"telegramId":"7234567890"}	f	2026-06-12 09:46:25.26031	894e2ff9-f989-4d35-af52-3c1ec8033b6d
94312843-2d6f-49f5-bcef-9fbe1e88ba65	training_done	{"telegramId":"6394982345","language":"he","unit":"giant","count":1}	f	2026-06-12 09:48:55.35396	118d280b-f01f-4afb-8efc-81618fdc8170
331822cd-a340-448d-b979-c883f5bb73fa	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":6,"count":1}	f	2026-06-12 09:58:16.702246	118d280b-f01f-4afb-8efc-81618fdc8170
78c455ce-ad69-4ae6-9029-abef362b33e9	build_done	{"telegramId":"6394982345","language":"he","building":"farm","level":10,"count":1}	f	2026-06-12 10:03:29.149631	118d280b-f01f-4afb-8efc-81618fdc8170
bc1a2669-af72-42a1-a520-f59922486549	training_done	{"telegramId":"6394982345","language":"he","unit":"titan","count":1}	f	2026-06-12 10:26:00.328737	118d280b-f01f-4afb-8efc-81618fdc8170
b06b80d8-90ea-4b7b-a2fe-70833cb7e488	training_done	{"telegramId":"6394982345","language":"he","unit":"giant","count":1}	f	2026-06-12 10:30:57.219864	118d280b-f01f-4afb-8efc-81618fdc8170
d774660c-085f-4685-a406-3af04d489220	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":3,"count":1}	f	2026-06-12 11:01:06.764709	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
66ced86f-0686-4c11-9374-8b5048a60288	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":6,"count":1}	f	2026-06-12 11:02:06.688091	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
f7437c4f-5583-4324-993f-a2678af20c8b	training_done	{"telegramId":"6575079418","language":"he","unit":"spearman","count":11}	f	2026-06-12 11:02:06.691194	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
a7da8ea8-3bc7-41d9-b9b6-f4c4e0c9a3e0	training_done	{"telegramId":"6575079418","language":"he","unit":"paladin","count":1}	f	2026-06-12 11:04:06.680079	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
695502c1-cb43-49a4-9c66-bb8f1a791f08	build_done	{"telegramId":"6575079418","language":"he","building":"town_hall","level":6,"count":1}	f	2026-06-12 11:04:06.679977	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
389ab7b2-d525-43d9-bdd7-5e0d3e2cf0b0	training_done	{"telegramId":"6575079418","language":"he","unit":"knight","count":1}	f	2026-06-12 11:06:06.716934	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
495ef2d4-50f2-48b5-87eb-e8bf795f9075	training_done	{"telegramId":"6575079418","language":"he","unit":"swordsman","count":11}	f	2026-06-12 11:07:04.497734	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
125bdc9b-2dd4-49c9-9730-08ecbac2f675	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":4,"count":1}	f	2026-06-12 11:08:27.41841	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
3ef83f5f-02e4-4cc7-8242-5fc6eb6e66f7	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":3,"count":1}	f	2026-06-12 11:10:25.082406	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
d7e77693-96c1-47f2-bb75-8c6ef90fb33c	admin_gift	{"type":"gold","amount":10000,"label":"💰 זהב ×10000","language":"he"}	f	2026-06-12 11:10:55.666578	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
46e0efc5-221a-44f4-9d53-7db759ba03f0	admin_gift	{"type":"wood","amount":10000,"label":"🪵 עץ ×10000","language":"he"}	f	2026-06-12 11:11:02.943779	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
227dd281-717c-4376-bd1c-a7250330e58a	admin_gift	{"type":"stone","amount":10000,"label":"🪨 אבן ×10000","language":"he"}	f	2026-06-12 11:11:13.979105	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
9d72c5e5-b245-448e-9194-da82d06addfa	build_done	{"telegramId":"6575079418","language":"he","building":"watch_tower","level":2,"count":1}	f	2026-06-12 11:11:26.773826	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
434962c2-d073-4f75-ae64-8dda036868e5	admin_gift	{"type":"gems","amount":100,"label":"💎 Gems ×100","language":"he"}	f	2026-06-12 11:13:30.30688	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
7e3f28ed-18fc-41a8-ad68-7160f0a4615c	admin_gift	{"type":"gold","amount":10000,"label":"💰 זהב ×10000","language":"he"}	f	2026-06-12 11:13:43.483084	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e96a99b1-296d-4811-87ac-050039aa68cf	admin_gift	{"type":"wood","amount":10000,"label":"🪵 עץ ×10000","language":"he"}	f	2026-06-12 11:13:54.244147	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
cefec5a7-00a2-46d3-bfdf-11ba344d346f	admin_gift	{"type":"stone","amount":10000,"label":"🪨 אבן ×10000","language":"he"}	f	2026-06-12 11:14:04.756158	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
ff20ea0b-be6b-4977-97b6-dca2ef8d205d	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":4,"count":1}	f	2026-06-12 11:14:27.227722	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
81366eb6-9588-447a-9be0-46250de4c5fb	training_done	{"telegramId":"6575079418","language":"he","unit":"cavalry","count":11}	f	2026-06-12 11:14:27.252281	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
29cb72d5-e668-4418-9250-4c0fc06c9716	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":5,"count":1}	f	2026-06-12 11:14:27.25671	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
caad449d-6b61-4a6e-8aea-c7b0c15fe645	admin_gift	{"type":"usdt","amount":10,"label":"💵 USDT ×10","language":"he"}	f	2026-06-12 11:15:10.316647	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
cdfb8937-04b9-4326-bb4c-4ec2f1da1d8d	build_done	{"telegramId":"6575079418","language":"he","building":"watch_tower","level":3,"count":1}	f	2026-06-12 11:16:26.753681	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
fd98ab34-0157-4282-9b5e-822ad6d148c2	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":3,"count":1}	f	2026-06-12 11:16:26.753751	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
7f4e8369-9287-40e6-b149-5ea1c960c109	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":4,"count":1}	f	2026-06-12 11:16:26.774762	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
b17b9986-ef35-42ad-9bdd-6b701ab8855a	build_done	{"telegramId":"6575079418","language":"he","building":"hospital","level":4,"count":1}	f	2026-06-12 11:17:26.662716	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
2593b2ed-ca56-488a-96b4-5328c233dc9f	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":6,"count":2}	f	2026-06-12 11:18:38.259692	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
45eb8435-0bcd-47db-b86b-f8159fd9fe07	build_done	{"telegramId":"6575079418","language":"he","building":"lumber_mill","level":4,"count":1}	f	2026-06-12 11:18:38.262375	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
79c38d00-0434-45ba-8d5d-e590b7031380	build_done	{"telegramId":"6575079418","language":"he","building":"academy","level":3,"count":1}	f	2026-06-12 11:18:38.264704	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
47b4430d-4a91-47c5-8bc9-5f1a06378a50	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":8,"count":1}	f	2026-06-12 11:22:36.839982	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
b35226e9-e971-4527-9088-c4cac068d921	training_done	{"telegramId":"6575079418","language":"he","unit":"knight","count":3}	f	2026-06-12 11:22:36.845561	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
99cdad01-d063-4817-82e7-3ce8265b4d74	attacked	{"attackerName":"🏰 kwi","gold":231,"wood":184,"won":true,"telegramId":"6469663868","language":"en"}	f	2026-06-12 11:29:53.183701	02f52ce4-587a-4cfb-91a8-da93a1668820
7ebf6dbf-f0ea-4fd1-9fde-69f2827b18cd	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"928045648","language":"he"}	f	2026-06-12 11:32:07.327462	0d5907f3-6feb-44c6-8f4f-43687783261f
d53bb036-7e47-4011-a65b-2a19793bd2af	training_done	{"telegramId":"6575079418","language":"he","unit":"cavalry","count":12}	f	2026-06-12 11:32:16.693243	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
0fdd1b05-40c3-46ed-b6b9-232225e7b190	attacked	{"attackerName":"🏰 kwi","gold":0,"wood":0,"won":false,"telegramId":"7234567890","language":"en"}	f	2026-06-12 11:32:42.895156	894e2ff9-f989-4d35-af52-3c1ec8033b6d
a6550ac6-3b84-4362-8eb7-b710207acfbb	attacked	{"attackerName":"🦁 AdaMic","gold":1200,"wood":960,"won":true,"telegramId":"647720443","language":"en"}	f	2026-06-12 11:33:08.453717	01271206-b687-44cb-a820-612b7ddc6593
21a2b387-07a0-4ed5-85c7-b9b913e8784c	attacked	{"attackerName":"🦁 AdaMic","gold":497,"wood":388,"won":true,"telegramId":"418120178","language":"en"}	f	2026-06-12 11:35:23.324563	be7ae33a-1b7a-47aa-8b55-98cdd9506f0c
fff5f500-ec8f-445a-9b0c-245c668e3d0c	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":6,"count":1}	f	2026-06-12 11:36:16.694708	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
d772b50d-5d3a-4192-9404-caf3eda75ffe	build_done	{"telegramId":"6575079418","language":"he","building":"gold_mine","level":3,"count":1}	f	2026-06-12 11:36:16.712471	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
b3da017f-092c-432d-96cc-9422a8339b33	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"6732523149","language":"he"}	f	2026-06-12 11:37:25.278603	a1dedbf4-4444-485e-bb47-ab46e9f96928
2cd1b242-522a-4fc4-922b-77067a9805df	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"415469240","language":"he"}	f	2026-06-12 11:37:35.866469	c54f3d04-0339-4321-8c0e-6ee30041bf65
bf79fd6e-a94b-4bc7-b178-a7d07de1764c	attacked	{"attackerName":"🦁 AdaMic","gold":750,"wood":600,"won":true,"telegramId":"373450154","language":"en"}	f	2026-06-12 11:37:46.490882	6bf59c72-777f-4166-8d45-5a57721d6c49
6700d460-daa2-456f-92df-9dde223ce39d	build_done	{"telegramId":"6575079418","language":"he","building":"farm","level":6,"count":1}	f	2026-06-12 11:38:16.707986	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
e8f17774-9c5f-4c86-9920-e7f567891184	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":2,"count":1}	f	2026-06-12 11:39:16.671347	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
ccff70dc-13d5-41ad-809e-8ce19e4e326f	attacked	{"attackerName":"🦁 AdaMic","gold":436,"wood":348,"won":true,"telegramId":"7723451677","language":"he"}	f	2026-06-12 11:40:04.552704	fcb14d93-2053-4ac3-93e8-85ba2cd78717
1fc28dcf-294b-4a3a-b326-260ea543dbda	build_done	{"telegramId":"6575079418","language":"he","building":"watch_tower","level":4,"count":1}	f	2026-06-12 11:40:16.686704	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
491badac-b605-4141-a39b-a8472c15afec	build_done	{"telegramId":"6575079418","language":"he","building":"stone_quarry","level":6,"count":1}	f	2026-06-12 11:45:00.154122	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
5dde9443-ae07-4bc8-b52d-eb11c9a25b44	training_done	{"telegramId":"6575079418","language":"he","unit":"swordsman","count":4}	f	2026-06-12 11:45:00.154644	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
2c70af86-966b-41fa-92e0-7a62a88e5210	attacked	{"attackerName":"🏰 kwi","gold":817,"wood":8870,"won":true,"telegramId":"6575079418","language":"he"}	f	2026-06-12 11:46:30.133122	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
ee721cde-ae4b-430e-b4d9-2bba7ff75953	build_done	{"telegramId":"6575079418","language":"he","building":"wall","level":9,"count":1}	f	2026-06-12 11:49:53.142552	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
efe8ad1d-4144-4ee1-92e9-d2081b8a4d2f	training_done	{"telegramId":"6575079418","language":"he","unit":"catapult","count":11}	f	2026-06-12 11:55:00.057722	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
dc5282b5-11f0-40ee-bd80-ff9cb06891cd	training_done	{"telegramId":"6394982345","language":"he","unit":"knight","count":1}	f	2026-06-12 11:55:05.185366	118d280b-f01f-4afb-8efc-81618fdc8170
143dd302-2d1c-4bb4-9ee5-fd4aa9bbca08	low_gems	{"telegramId":"6575079418","language":"he","gems":0}	f	2026-06-12 12:00:00.08072	628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4
2a2d0cd1-ede9-4662-af31-2c9bd001f9d0	low_gems	{"telegramId":"7234567890","language":"en","gems":51}	f	2026-06-12 12:00:00.361125	894e2ff9-f989-4d35-af52-3c1ec8033b6d
cc2eb2f7-1222-4505-915f-e1c71c6c813b	low_gems	{"telegramId":"836329038","language":"ru","gems":100}	f	2026-06-12 12:00:00.445935	d3fc6f10-5d93-4f88-978c-977963d7c74d
\.


--
-- Data for Name: quests; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.quests (id, quest_key, period, progress, target, completed, reward_claimed, period_date, kingdom_id) FROM stdin;
e5936786-ef25-4125-b390-7f8668125bca	collect_gold_1000	daily	0	1000	f	f	2026-06-02	746c4b4a-446f-45c0-98ac-2dc921edca96
0fd7b3e2-c5a8-4735-925d-1f1aa39df628	upgrade_building	daily	0	1	f	f	2026-06-02	746c4b4a-446f-45c0-98ac-2dc921edca96
ee4f838d-f018-4ed2-8222-dd07c1700dbf	perform_attack	daily	0	1	f	f	2026-06-02	746c4b4a-446f-45c0-98ac-2dc921edca96
af18bddf-e9b0-4284-b39a-1b386d3270ac	collect_gold_1000	daily	0	1000	f	f	2026-06-02	b963184a-af92-415e-90cc-a58d7b175bc5
ca659cd4-4755-474c-9921-7a67a3742cfa	upgrade_building	daily	0	1	f	f	2026-06-02	b963184a-af92-415e-90cc-a58d7b175bc5
09288bba-5c69-440f-9530-4fb129dbcf03	perform_attack	daily	0	1	f	f	2026-06-02	b963184a-af92-415e-90cc-a58d7b175bc5
8b60dd47-a310-429d-b972-186160c96e16	win_20_battles	weekly	0	20	f	f	2026-06-01	b963184a-af92-415e-90cc-a58d7b175bc5
6cafa11c-286b-4da0-b535-26f4291e3585	perform_attack	daily	0	1	f	f	2026-06-03	746c4b4a-446f-45c0-98ac-2dc921edca96
d76bea6c-4270-444c-a4db-9dd86b18ddd7	upgrade_building	daily	1	1	t	f	2026-06-05	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
6bc39fa4-df68-4f3e-b37d-9264be7e4608	upgrade_building	daily	1	1	t	t	2026-06-03	746c4b4a-446f-45c0-98ac-2dc921edca96
c0c6dbf7-5dc4-42ab-95b5-76550c606a1b	collect_gold_1000	daily	1000	1000	t	t	2026-06-03	746c4b4a-446f-45c0-98ac-2dc921edca96
ab7779a3-76b8-4f66-8d92-1c6a0e98e299	perform_attack	daily	1	1	t	f	2026-06-05	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
b9a8e619-0238-40c0-80f9-0ca9629a2578	collect_gold_1000	daily	0	1000	f	f	2026-06-03	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
419618b6-2f1d-43a9-9f38-cf1c7aa22d2a	upgrade_building	daily	0	1	f	f	2026-06-03	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
7e752c5e-290b-4057-a23c-d76bdd2f13ea	perform_attack	daily	0	1	f	f	2026-06-03	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
9f1fdd43-7fae-4277-aad1-0633d9ccf79d	perform_attack	daily	0	1	f	f	2026-06-04	746c4b4a-446f-45c0-98ac-2dc921edca96
fb606493-3ae8-41c6-a050-47969339fc13	collect_gold_1000	daily	1000	1000	t	f	2026-06-05	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
8cf4a34f-194e-4f3b-a822-c7daa9758745	train_500_soldiers	weekly	1	500	f	f	2026-06-01	b963184a-af92-415e-90cc-a58d7b175bc5
35cf624b-7420-46c6-b1ea-19a286c6d409	collect_gold_1000	daily	1000	1000	t	t	2026-06-04	746c4b4a-446f-45c0-98ac-2dc921edca96
9620b0c8-93af-4068-b9b2-0bdb1307f067	upgrade_building	daily	1	1	t	t	2026-06-04	746c4b4a-446f-45c0-98ac-2dc921edca96
fd4ca492-d08d-4a0c-ba99-ded7da8a0137	upgrade_building	daily	1	1	t	t	2026-06-05	746c4b4a-446f-45c0-98ac-2dc921edca96
447f9f1f-05b9-411a-9be8-58c0cad6fb1c	collect_gold_1000	daily	1000	1000	t	t	2026-06-05	746c4b4a-446f-45c0-98ac-2dc921edca96
5866d7b1-4a4f-48db-bcb4-ef1ccb179290	perform_attack	daily	1	1	t	t	2026-06-05	746c4b4a-446f-45c0-98ac-2dc921edca96
a973731d-0af0-4409-9959-45d52d7fc68c	collect_gold_1000	daily	0	1000	f	f	2026-06-07	b963184a-af92-415e-90cc-a58d7b175bc5
cd87c3ea-3345-4be3-ac0c-d0c643948447	upgrade_building	daily	0	1	f	f	2026-06-07	b963184a-af92-415e-90cc-a58d7b175bc5
b5274857-2b13-42b6-8533-2ed9b51cfe43	upgrade_building	daily	1	1	t	t	2026-06-08	746c4b4a-446f-45c0-98ac-2dc921edca96
f7909a64-1566-4153-89a8-78f748ed5a9e	perform_attack	daily	1	1	t	f	2026-06-07	b963184a-af92-415e-90cc-a58d7b175bc5
cee6d577-621b-45b8-9d40-71d578908e62	upgrade_building	daily	1	1	t	t	2026-06-06	746c4b4a-446f-45c0-98ac-2dc921edca96
801756bd-f914-4de3-8498-5561453df693	collect_gold_1000	daily	1000	1000	t	t	2026-06-08	746c4b4a-446f-45c0-98ac-2dc921edca96
2a2b2ddc-7b89-45d0-bf8e-d971442dd620	perform_attack	daily	1	1	t	t	2026-06-08	746c4b4a-446f-45c0-98ac-2dc921edca96
2d537af4-9149-4841-92f4-f9078996dc3b	train_500_soldiers	weekly	0	500	f	f	2026-06-08	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c
b8c608a1-c9fd-4aba-bfa1-32449c2b6872	upgrade_building	daily	1	1	t	f	2026-06-07	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
ca9654f1-0300-45d3-8d53-0ff504199b4c	perform_attack	daily	1	1	t	t	2026-06-06	746c4b4a-446f-45c0-98ac-2dc921edca96
67633728-c150-4354-a9af-e6dbf1e20fbf	collect_gold_1000	daily	1000	1000	t	t	2026-06-06	746c4b4a-446f-45c0-98ac-2dc921edca96
1b1500b2-4e04-4f4f-b581-d24a024c0c06	win_20_battles	weekly	0	20	f	f	2026-06-08	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c
c247535b-cbde-4148-9c85-1f47f9abbfeb	collect_gold_1000	daily	1000	1000	t	t	2026-06-08	130d40b6-ff88-4a09-9912-37398c79d3d2
1a72abe7-5f20-46df-8c15-7ac5268d0127	perform_attack	daily	1	1	t	t	2026-06-08	130d40b6-ff88-4a09-9912-37398c79d3d2
1abf23af-4aca-4d53-8038-3d5d09794529	train_500_soldiers	weekly	14	500	f	f	2026-06-01	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
54f74d16-0bda-4307-857c-8848d34e4bcd	perform_attack	daily	1	1	t	f	2026-06-07	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
cfdb4199-196e-4025-884f-d59a1a9abc5c	collect_gold_1000	daily	1000	1000	t	f	2026-06-07	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
f6e7cd84-092b-4c58-b8fc-79243cbcdcdb	win_20_battles	weekly	3	20	f	f	2026-06-01	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
53fa8999-80ce-4d6e-b9a5-dc73d043eb4d	collect_gold_1000	daily	1000	1000	t	t	2026-06-07	746c4b4a-446f-45c0-98ac-2dc921edca96
0a44244c-3bd1-47db-8e20-df8fd9155399	upgrade_building	daily	1	1	t	t	2026-06-07	746c4b4a-446f-45c0-98ac-2dc921edca96
a9c8b368-545b-45a4-85b1-5776ff070519	collect_gold_1000	daily	0	1000	f	f	2026-06-08	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
4e3e19af-bb52-4d35-a46e-6e30d9324ff1	perform_attack	daily	1	1	t	t	2026-06-07	746c4b4a-446f-45c0-98ac-2dc921edca96
a628e425-b295-45ba-9e18-8305818a2bfa	upgrade_building	daily	1	1	t	t	2026-06-08	130d40b6-ff88-4a09-9912-37398c79d3d2
e29f0d5a-085d-4d4e-a5ef-12a768260209	perform_attack	daily	0	1	f	f	2026-06-08	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
f1958945-8180-4c66-aad6-3467e833f3a8	upgrade_building	daily	1	1	t	f	2026-06-08	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
4cf0e9f6-fdc2-4092-9947-502e4e45a9ce	train_500_soldiers	weekly	307	500	f	f	2026-06-01	746c4b4a-446f-45c0-98ac-2dc921edca96
a58b37a0-c7ac-49af-beec-3bdd11cb3e1e	win_20_battles	weekly	20	20	t	t	2026-06-01	746c4b4a-446f-45c0-98ac-2dc921edca96
13554269-4d1f-41d4-8f0e-7c42e49b5941	win_20_battles	weekly	0	20	f	f	2026-06-08	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
43cbd4a3-2fec-4117-924a-7eb7c3016f2a	upgrade_building	daily	1	1	t	t	2026-06-10	130d40b6-ff88-4a09-9912-37398c79d3d2
4dc86718-0a58-47a4-a77d-b774acbbfcc4	perform_attack	daily	1	1	t	t	2026-06-10	130d40b6-ff88-4a09-9912-37398c79d3d2
f79d9943-1442-48c9-a2e2-82cbfd4616e9	upgrade_building	daily	1	1	t	t	2026-06-10	746c4b4a-446f-45c0-98ac-2dc921edca96
16458b64-07d9-416b-970d-c897dd26061c	collect_gold_1000	daily	1000	1000	t	t	2026-06-11	746c4b4a-446f-45c0-98ac-2dc921edca96
ac7dbaf7-8799-4c24-a55c-fcb57b1d7e0a	collect_gold_1000	daily	1000	1000	t	t	2026-06-10	746c4b4a-446f-45c0-98ac-2dc921edca96
55caa593-de47-4cc2-95dc-ef896b56e813	collect_gold_1000	daily	0	1000	f	f	2026-06-11	130d40b6-ff88-4a09-9912-37398c79d3d2
82bdb56b-9fbc-49ec-9be9-dcc94daf83dc	collect_gold_1000	daily	1000	1000	t	t	2026-06-10	130d40b6-ff88-4a09-9912-37398c79d3d2
8998c9ed-bd26-4fc8-b64d-f2742c64db8d	win_20_battles	weekly	20	20	t	f	2026-06-08	130d40b6-ff88-4a09-9912-37398c79d3d2
0c017572-5dc8-4b11-ade6-037904e291fb	collect_gold_1000	daily	0	1000	f	f	2026-06-08	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c
473ebf7d-a5bf-4edf-994e-e48e15438e52	perform_attack	daily	0	1	f	f	2026-06-08	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c
a3d0e9ea-b794-4716-8662-2642db324265	upgrade_building	daily	1	1	t	f	2026-06-08	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c
381c5860-df3f-4023-aae4-e8b4a8bde555	train_500_soldiers	weekly	10	500	f	f	2026-06-08	a87c98e6-fa02-41c7-b517-5f9b7fe87af7
43f9e257-0abc-4a68-91df-102fe68067f8	train_500_soldiers	weekly	500	500	t	t	2026-06-08	746c4b4a-446f-45c0-98ac-2dc921edca96
7c467595-2b79-4fac-9fc3-3429cb02c9bb	perform_attack	daily	1	1	t	t	2026-06-10	746c4b4a-446f-45c0-98ac-2dc921edca96
09beec22-9dd5-4f64-99d0-69705ad1d932	perform_attack	daily	1	1	t	t	2026-06-12	746c4b4a-446f-45c0-98ac-2dc921edca96
86aeda7b-1c8c-41b8-87fe-0035d8eb8cf8	perform_attack	daily	0	1	f	f	2026-06-11	130d40b6-ff88-4a09-9912-37398c79d3d2
063c2afd-5128-42ed-a504-160d7919856d	upgrade_building	daily	1	1	t	f	2026-06-11	130d40b6-ff88-4a09-9912-37398c79d3d2
9a8d78ae-694c-48c1-bf44-9827e2b9cbde	upgrade_building	daily	1	1	t	t	2026-06-11	746c4b4a-446f-45c0-98ac-2dc921edca96
73596063-995f-46d1-9574-4519278fda97	perform_attack	daily	1	1	t	t	2026-06-11	746c4b4a-446f-45c0-98ac-2dc921edca96
309b8ff4-d3dd-4190-b9a3-990a3188373d	perform_attack	daily	1	1	t	f	2026-06-12	130d40b6-ff88-4a09-9912-37398c79d3d2
91e70c5e-a384-48ec-a658-5bf439d28ef3	collect_gold_1000	daily	1000	1000	t	t	2026-06-12	746c4b4a-446f-45c0-98ac-2dc921edca96
7bca60a9-4f09-4344-b37a-28850a8e6f1b	upgrade_building	daily	1	1	t	t	2026-06-12	130d40b6-ff88-4a09-9912-37398c79d3d2
e921572c-242e-4650-b4ef-563b5bba664f	win_20_battles	weekly	20	20	t	t	2026-06-08	746c4b4a-446f-45c0-98ac-2dc921edca96
285c9405-a0ec-4337-a7e2-f827bbb9d5c6	upgrade_building	daily	1	1	t	t	2026-06-12	746c4b4a-446f-45c0-98ac-2dc921edca96
d10e15e5-de38-4898-8ae0-615c26aa7021	collect_gold_1000	daily	1000	1000	t	f	2026-06-12	130d40b6-ff88-4a09-9912-37398c79d3d2
66fc6c85-7d19-4558-9d30-c8704104b9fa	train_500_soldiers	weekly	154	500	f	f	2026-06-08	130d40b6-ff88-4a09-9912-37398c79d3d2
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.units (id, type, count, training_count, training_ends_at, kingdom_id, wounded_count) FROM stdin;
d8d17acb-dcc5-4072-80ff-cc7fb8a02a9b	spearman	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
fe4550de-7b81-40b8-aae7-9fddf9bd6781	archer	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
e6858e84-6c25-4eb2-a7f2-30078677a3ad	swordsman	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
ddfedfcf-128c-420e-97d1-22a689e1d63a	cavalry	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
a6f26b9b-6096-4d9f-bdaf-e15f825d1484	catapult	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
4c9bd2c7-dc37-4f62-90ba-fea5602ed10c	elite_guard	0	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
a69de35a-ea0e-495c-8c2c-c0814ce30de7	spearman	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
a4ced2db-5f48-434f-a023-1e66bc48e37c	archer	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
822ec41e-6365-4f7b-8911-596a894b4a64	archer	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
b202aa32-dd28-4da7-90df-e60ab01253cf	swordsman	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
86a3f9ef-8968-47d0-86ca-59909303b542	cavalry	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
c03b622c-9fe5-411e-9d3b-908034ae8a7a	catapult	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
16672777-1d12-4a23-9b7d-d289ddc8dd97	elite_guard	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
c15f5b90-9be6-4f7d-8bca-38320010a4a8	swordsman	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
14cfdff2-faa6-45de-bbee-8652f4e6f4b3	cavalry	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
5df27f8e-603a-410d-a1c0-05a49fa79674	catapult	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
6a55ee21-2089-4958-8f69-7108419fd3a9	elite_guard	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
414d6726-75c1-4542-be9a-c7891537c0b2	paladin	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
2d76e494-6343-4007-932e-775c10669e8e	dragon_rider	0	0	\N	e69fc33e-6895-4c64-903a-37a0f6ab3e33	0
38539f50-e88f-4ef3-b50e-948a381f4d78	catapult	0	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0
c608548d-b948-45c4-b911-41d80f2fec32	elite_guard	0	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0
40fcda85-1313-4271-95f1-d48f075dd21d	paladin	0	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0
2573ca54-f8df-47d4-a762-7b1db35f8e0d	dragon_rider	0	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	0
26727bb8-cfab-4dcf-8f8d-390d4f42aa1a	spearman	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
dbefea2e-bb99-475c-96de-68d53582f16d	archer	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
2cc29fc9-f2d5-402c-a598-0a1505c08d5e	swordsman	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
c1c51949-98cd-46f3-ae13-0dc122ca458e	cavalry	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
09d3fd58-aa69-4fcc-bad3-a9c2e2c2efce	catapult	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
0ca0958e-0e8f-4754-93cf-749b75fe4b02	elite_guard	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
6c1d060b-b9ae-4b3d-8d01-986531fcfb65	paladin	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
622a7463-0f72-4df3-8a53-9ab30b52ef9a	dragon_rider	0	0	\N	946b56c7-957e-43ee-bfaf-57e7f8fd0f9c	0
3f833681-797c-463d-a446-2f6d5f666d8e	paladin	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
7b4febc9-4173-445f-9965-d93953555eb4	dragon_rider	0	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
2057c472-5377-488d-a48b-81d9f88ad4c6	spearman	1	0	\N	b963184a-af92-415e-90cc-a58d7b175bc5	0
464a1971-6840-45a7-84c3-4dfb2c698ced	spearman	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
cfca9746-e9e9-4063-a876-f5d663ad5822	archer	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
a205ab65-ade0-44bf-9a9d-185738d2a05e	swordsman	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
08a2aa79-66c9-46bc-a718-6da3a4d733ac	cavalry	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
9c9b1de4-25f7-4f75-8dc0-6d28aaa313e5	catapult	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
157bb9e3-7f82-4d25-88f1-a61f6a6a14d1	elite_guard	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
8a9caeb6-5a40-4e96-8b55-256bdca1e61d	paladin	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
9a820d0f-7995-4873-8a69-6c0ea36f030b	dragon_rider	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
59197fb1-62bd-4716-a27f-2573d21deb7b	spearman	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
5dbf5bda-8279-4cc2-8a16-1622ad123a31	archer	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
16bb2029-8a4e-43b0-a59c-dae68119d885	swordsman	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
78f70f21-776e-44c4-bd14-bb1d01dc429d	cavalry	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
4be2d685-9d42-40b1-85d2-f308eeacc40f	catapult	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
056e4096-a263-4c6e-8309-c3e660e85c41	elite_guard	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
1f13d97b-224f-411e-98a9-7c3047616c54	paladin	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
7b9c2730-b970-425f-bfa3-68edfc57b9c8	dragon_rider	0	0	\N	402f21aa-776c-4f8d-9652-ff051982ce8b	0
1698cdae-ba56-41b8-9df1-ed65fb3f3fa4	spearman	30	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
884f860f-2df4-4250-acdc-bdd10d792a8e	catapult	11	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
c80ea168-be94-49df-bd36-011dbf0cebc5	dragon_rider	2	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
6cbf1cfd-9f1f-4a4b-a42b-5b7194bdd5b4	paladin	3	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
7496c52c-8b06-47b4-93f1-d828a26dd382	spearman	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
c331dbe3-8e5e-48c6-a834-265ad0283269	archer	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
1e6a9049-8f58-4fa5-85c9-f2177f821037	swordsman	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
4137dd82-ec14-4a6c-b69e-ad06b345f333	cavalry	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
657dc668-f10e-4f04-b4ed-fe103e23a03b	catapult	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
83823f40-b026-4109-9d23-eb33dcdf3555	elite_guard	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
e9f7b72e-973b-4c91-a216-213f884e8b1b	paladin	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
2bec00fb-bf8f-427f-9a38-06891ebc7fe4	dragon_rider	0	0	\N	b13b4a02-5e6c-48ce-8e8e-2709c4b67dbd	0
2bfa5b85-6fb7-4a4f-a3dd-dc8477be9968	paladin	1	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
6b03c9dd-e1b2-4315-90e3-87ea21a2234c	catapult	14	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
f628b1de-51b5-4365-b0fe-19562f274511	swordsman	145	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
d9aee408-2681-4d0a-9d91-a095decb5ea7	elite_guard	39	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
1067ae13-3747-4cb6-ab94-e10cddd8ca26	swordsman	30	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
f8c4265e-095b-4f9b-a97d-34bc3e3b66d6	cavalry	54	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
abfb24bf-2867-44b1-ba00-96feab98b668	spearman	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
ca627bda-45ca-4576-83ee-c5938ed0011e	archer	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
3daab7b4-1f13-4e10-9e6d-37e231daaa03	swordsman	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
affe0ab8-f107-4535-ad11-f4ff0fb5f364	cavalry	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
a273a532-f332-4556-a678-5fe5e155a0e5	catapult	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
83baec5c-ab16-4a83-b698-b7008ead6324	elite_guard	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
b965f75a-8938-4d22-8019-0b7fe6b82295	paladin	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
ac5b576c-c3ff-4a76-95af-96af9cc4f1af	dragon_rider	0	0	\N	03ec9863-5a43-4a56-862c-87a7327d758a	0
b25d1d36-ad66-48cb-9deb-24a9a35d229c	spearman	215	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
dfe24bbf-f395-4be5-9ec6-ca0e4f21dbca	archer	14	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
d0ffbaed-08e2-478e-843f-46e6951e03fc	elite_guard	0	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
55c23a82-0c66-4e33-b811-1831d8915099	dragon_rider	0	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
23583b04-08a6-40d8-95a8-3a4846d77bf1	archer	2	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
4e1cd8dd-e63f-4718-9f7e-87c693c77214	cavalry	60	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	17
6cfc8685-481f-4b2a-82c9-ddb7f0fe7f4d	spearman	4	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	4
2a47ff21-14ca-4c01-8e7a-00e5ee38327d	swordsman	4	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	4
09285598-a99f-42c2-915a-f535089b7dc5	titan	13	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
fea83120-2aa6-4ae8-a82e-d40fb94137f3	knight	3	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
fb023826-2b28-4db0-9bb6-ac7a8c7196b2	knight	2	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
b13ea6f2-0049-4c8f-83b3-9fce95a9f4a0	spearman	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
3e02efc9-7669-4ea6-ae5a-6ad47b208045	archer	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
32823ff1-388e-4eae-9107-f932c7a695b8	swordsman	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
c22fa4ac-c1d9-43ac-bb40-a91f07add952	cavalry	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
24af8ede-8316-483a-8cbe-7eac1d21e78e	catapult	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
d367dd6b-acba-44bd-ac69-e4e597780f21	elite_guard	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
fbd1b483-b153-41d3-9d16-0aeb9c2721df	paladin	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
93615842-7577-4c2c-8fde-5d936980511f	dragon_rider	0	0	\N	f75e5129-48c8-4d36-a4ae-38ac3547b2a8	0
cd55914c-529b-46cb-bce7-97a23b1ef868	spearman	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
78e13f7d-7b9b-4492-ac1e-00a188827939	archer	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
af659db5-8654-4689-b087-615fcd0460ca	swordsman	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
5d0d7e0e-8baa-4b61-bb3a-00ba69404489	cavalry	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
66a9c08a-a186-4f99-b572-ea086fd0e763	catapult	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
92a3e660-d1cc-4228-bfe4-30dd59917667	elite_guard	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
6cdb462c-2028-4b49-b856-adde49d52883	paladin	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
09629db5-7728-4519-a42b-e183ce6ad78d	dragon_rider	0	0	\N	8b6fee86-e9aa-4845-80a6-792ef2e9e997	0
38841fcc-1080-46f6-95fd-85105b480d12	ragnar	0	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
b6766972-df56-4df6-9d5b-7f4fb40401f4	archer	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
4ea49a71-83ef-4445-8a94-fa1b6a5a1c0b	catapult	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
71840881-2e88-4564-888d-9419978ea9fe	elite_guard	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
b8e1bfb5-5c23-4891-9ad7-d9c5ad1e14b3	paladin	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
7ba76f6f-4f4c-4d15-9523-a1aae50e3fd9	dragon_rider	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
a61c8d10-8f5a-4aae-8b5b-2b35aafc2cb0	ragnar	0	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
52ff18cf-d04b-4678-ba22-994626847643	titan	0	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
c5f78367-0e74-4d9d-adb5-0754c9718ce6	ragnar	0	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
c1db8d57-971d-4008-82dc-2ec1dfae47ec	giant	1	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
6905a88d-1e63-4338-a981-f371446f2b09	titan	1	0	\N	2de1803f-93db-4b33-8032-b95927f1339d	0
376e01cb-3b22-49bf-9f89-7a4bee0b11ce	giant	3	0	\N	746c4b4a-446f-45c0-98ac-2dc921edca96	0
833f5a4e-75f1-46c7-9eb8-3b04cc9c2226	giant	0	0	\N	130d40b6-ff88-4a09-9912-37398c79d3d2	0
9b669d5f-20be-42e2-ae5b-3f445e1da538	giant	1	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
ce2649ea-f3e4-408d-8e75-a20732e2d527	titan	1	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
2888c75b-cf1d-497b-9d2f-61bb1ad7f376	knight	1	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
fe44324e-ca9c-4be4-a009-5e2a390bd3b4	spearman	50	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
58690dd1-a631-4f11-8acc-91b0ebf87d34	swordsman	30	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
76ee7116-caef-4090-925f-8dc25e1351fd	cavalry	20	0	\N	a9f9191f-3c7f-49a5-a578-0654713a4b89	0
b20e2e54-0434-4927-b7ef-e6a64b2c4e7a	cavalry	3	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	3
33db0862-7c6d-43e0-a1ea-f112097f8bfd	archer	4	0	\N	a87c98e6-fa02-41c7-b517-5f9b7fe87af7	4
131cbbb4-9cfd-45b4-8fa6-d81ff095b94a	knight	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
ab9617cd-39e9-4da9-b749-8d8745b2f1c4	ragnar	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
842a18c7-752e-4786-b08c-7add1cd5e3aa	titan	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
4c149a18-dbdf-4712-9d3f-bb90f89b1b04	giant	0	0	\N	ec0f159a-e2fc-496e-9c30-f8bb3942f406	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.users (id, telegram_id, username, first_name, avatar_url, referral_code, created_at, last_login, referred_by, claimed_referral_milestones, language, terms_accepted_at, referral_claimed_count) FROM stdin;
a1dedbf4-4444-485e-bb47-ab46e9f96928	6732523149	\N	תומר	\N	5HNAQQ16	2026-06-04 08:56:58.294419	2026-06-12 11:39:45.395	\N		he	2026-06-08 11:43:45.032	0
628d9bd9-84d4-43b4-8f9f-f5f7a77d4ef4	6575079418	\N	Idan	\N	8WRXZETN	2026-06-08 07:44:49.284283	2026-06-12 11:49:53.101	118d280b-f01f-4afb-8efc-81618fdc8170		he	2026-06-08 07:46:43.437	0
73476f2f-7699-4fce-afe2-9eb20831f3b5	7703883486	Jsusysts	.	\N	39LKI3FB	2026-06-10 09:31:46.924716	2026-06-10 09:31:46.924	\N		uz	\N	0
118d280b-f01f-4afb-8efc-81618fdc8170	6394982345	it953	I	\N	951XMCTZ	2026-05-02 05:52:37	2026-06-12 12:02:09.999	\N		he	2026-06-06 20:45:37.712	1
be7ae33a-1b7a-47aa-8b55-98cdd9506f0c	418120178	maoryona	Maor	\N	YWSDFHCI	2026-06-03 15:50:45.88545	2026-06-08 15:25:14.598	\N		en	\N	0
74607d68-28e1-4d50-8281-57ad37e40d32	1136363784	shiran121254	mario	\N	FLDJOLHK	2026-06-10 08:29:22.291295	2026-06-10 08:29:32.942	118d280b-f01f-4afb-8efc-81618fdc8170		he	\N	0
01271206-b687-44cb-a820-612b7ddc6593	647720443	elad12345678	מנשה	\N	AYUIRE90	2026-06-03 15:05:48.839275	2026-06-08 21:24:56.425	\N		en	\N	0
0d5907f3-6feb-44c6-8f4f-43687783261f	928045648	mmsupply	David	\N	ZVQBNE5S	2026-06-02 08:53:05.103466	2026-06-07 11:24:17.062	\N		he	2026-06-07 11:24:31.271	0
d3fc6f10-5d93-4f88-978c-977963d7c74d	836329038	kvander	Kvander	\N	0BTKRFN1	2026-06-10 11:23:09.479601	2026-06-10 11:23:09.479	\N		ru	2026-06-10 11:23:12.792	0
894e2ff9-f989-4d35-af52-3c1ec8033b6d	7234567890	itzik251	Itzik	\N	EF3U8SY1	2026-06-02 05:52:00.376476	2026-06-02 05:52:00.376476	\N		en	\N	0
02f52ce4-587a-4cfb-91a8-da93a1668820	6469663868	adsgramsupport	AdsGram.ai	\N	LZ3SFJH6	2026-06-04 11:08:40.807456	2026-06-04 11:08:40.807456	\N		en	\N	0
fcb14d93-2053-4ac3-93e8-85ba2cd78717	7723451677	\N	משה	\N	AQ77JFKW	2026-06-06 19:44:41.173576	2026-06-06 19:44:41.173576	\N		he	\N	0
c54f3d04-0339-4321-8c0e-6ee30041bf65	415469240	\N	Yosef	\N	7DGWRDW0	2026-06-07 14:30:13.138477	2026-06-07 14:30:13.138477	118d280b-f01f-4afb-8efc-81618fdc8170		he	\N	0
6bf59c72-777f-4166-8d45-5a57721d6c49	373450154	leo_messi24	Leo	\N	F52A0LQM	2026-06-04 15:35:15.820372	2026-06-10 03:08:25.835	\N		en	\N	0
\.


--
-- Data for Name: vip_tx_hashes; Type: TABLE DATA; Schema: public; Owner: kw_user
--

COPY public.vip_tx_hashes (tx_hash, user_id, activated_at) FROM stdin;
\.


--
-- Name: kingdoms PK_1c579ab8ed833694f47bf0ab293; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.kingdoms
    ADD CONSTRAINT "PK_1c579ab8ed833694f47bf0ab293" PRIMARY KEY (id);


--
-- Name: alliances PK_399af2ac4eb985fd426454df023; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT "PK_399af2ac4eb985fd426454df023" PRIMARY KEY (id);


--
-- Name: units PK_5a8f2f064919b587d93936cb223; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: alliance_members PK_7d2034cb9de7550cb4f399db211; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT "PK_7d2034cb9de7550cb4f399db211" PRIMARY KEY (alliance_id, kingdom_id);


--
-- Name: quests PK_a037497017b64f530fe09c75364; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT "PK_a037497017b64f530fe09c75364" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: buildings PK_bc65c1acce268c383e41a69003a; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT "PK_bc65c1acce268c383e41a69003a" PRIMARY KEY (id);


--
-- Name: battle_logs PK_d93d47de5877731db91c39bd608; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.battle_logs
    ADD CONSTRAINT "PK_d93d47de5877731db91c39bd608" PRIMARY KEY (id);


--
-- Name: kingdoms REL_9fd3d031a02c12a3ad977db4ac; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.kingdoms
    ADD CONSTRAINT "REL_9fd3d031a02c12a3ad977db4ac" UNIQUE (user_id);


--
-- Name: users UQ_1a1e4649fd31ea6ec6b025c7bfc; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_1a1e4649fd31ea6ec6b025c7bfc" UNIQUE (telegram_id);


--
-- Name: quests UQ_2397d0863453ff699a9c30adf55; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT "UQ_2397d0863453ff699a9c30adf55" UNIQUE (kingdom_id, quest_key, period_date);


--
-- Name: alliances UQ_6de0494750b3d494660c9e1a8c6; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT "UQ_6de0494750b3d494660c9e1a8c6" UNIQUE (name);


--
-- Name: users UQ_ba10055f9ef9690e77cf6445cba; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE (referral_code);


--
-- Name: alliances UQ_db23a43f3d2d2cee9fc0c32762c; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT "UQ_db23a43f3d2d2cee9fc0c32762c" UNIQUE (tag);


--
-- Name: ad_reward_tokens ad_reward_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.ad_reward_tokens
    ADD CONSTRAINT ad_reward_tokens_pkey PRIMARY KEY (token);


--
-- Name: antibot_bans antibot_bans_pkey; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.antibot_bans
    ADD CONSTRAINT antibot_bans_pkey PRIMARY KEY (user_id);


--
-- Name: vip_tx_hashes vip_tx_hashes_pkey; Type: CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.vip_tx_hashes
    ADD CONSTRAINT vip_tx_hashes_pkey PRIMARY KEY (tx_hash);


--
-- Name: idx_art_kingdom; Type: INDEX; Schema: public; Owner: kw_user
--

CREATE INDEX idx_art_kingdom ON public.ad_reward_tokens USING btree (kingdom_id);


--
-- Name: idx_art_used_at; Type: INDEX; Schema: public; Owner: kw_user
--

CREATE INDEX idx_art_used_at ON public.ad_reward_tokens USING btree (used_at);


--
-- Name: units FK_0f8612182f951099018130b4d17; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT "FK_0f8612182f951099018130b4d17" FOREIGN KEY (kingdom_id) REFERENCES public.kingdoms(id);


--
-- Name: quests FK_12477f515fd7120c9dbe329b36c; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT "FK_12477f515fd7120c9dbe329b36c" FOREIGN KEY (kingdom_id) REFERENCES public.kingdoms(id);


--
-- Name: alliance_members FK_8621b753601984e6fb3ced8846c; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT "FK_8621b753601984e6fb3ced8846c" FOREIGN KEY (alliance_id) REFERENCES public.alliances(id);


--
-- Name: alliances FK_92ba454f92357a6eb2759348204; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT "FK_92ba454f92357a6eb2759348204" FOREIGN KEY (leader_id) REFERENCES public.kingdoms(id);


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: kingdoms FK_9fd3d031a02c12a3ad977db4ac6; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.kingdoms
    ADD CONSTRAINT "FK_9fd3d031a02c12a3ad977db4ac6" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: buildings FK_bdabf373adfd314baef01a63f1b; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT "FK_bdabf373adfd314baef01a63f1b" FOREIGN KEY (kingdom_id) REFERENCES public.kingdoms(id);


--
-- Name: users FK_cae1425350da39cb85345115cbb; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_cae1425350da39cb85345115cbb" FOREIGN KEY (referred_by) REFERENCES public.users(id);


--
-- Name: alliance_members FK_f9a1d322bdaece885e50bbcba48; Type: FK CONSTRAINT; Schema: public; Owner: kw_user
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT "FK_f9a1d322bdaece885e50bbcba48" FOREIGN KEY (kingdom_id) REFERENCES public.kingdoms(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO kw_user;


--
-- PostgreSQL database dump complete
--

\unrestrict Od4VM9X1EZpfhhL1UpOQWpZAdPulYyVy5k5i5l4kWq3aMdiVCZbTiBGnZhuSXwK

