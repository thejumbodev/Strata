-- ============================================================
-- Strata schema  (run in Supabase SQL editor)
-- ============================================================

create table if not exists workspaces (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  owner_id           uuid not null references auth.users(id) on delete cascade,
  discord_token      text,
  discord_client_id  text,
  alerts_channel_id  text,
  guild_id           text,
  plan               text not null default 'free',
  created_at         timestamptz default now()
);
-- Migration for existing databases:
-- ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

create table if not exists channels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  created_at    timestamptz default now()
);

create table if not exists cards (
  id               uuid primary key default gen_random_uuid(),
  channel_id       uuid not null references channels(id) on delete cascade,
  title            text not null,
  status           text not null default 'Ideas'
                     check (status in ('Ideas','Recorded','Edited','Uploaded')),
  thumb_url        text,
  notes            jsonb,         -- TipTap JSON document
  record_datetime  timestamptz,
  created_at       timestamptz default now()
);

create table if not exists members (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  name             text not null,
  role             text not null
                     check (role in ('Editor','Animator','Thumbnail','Scriptwriter','Videographer','Collaborator')),
  discord_user_id  text,
  rate_type        text    not null default 'per_video' check (rate_type in ('per_video', 'per_hour')),
  rate_amount      numeric not null default 0,
  created_at       timestamptz default now()
);
-- Migration for existing databases:
-- ALTER TABLE members DROP COLUMN IF EXISTS discord_username;
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS rate_type   text    NOT NULL DEFAULT 'per_video';
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS rate_amount numeric NOT NULL DEFAULT 0;

create table if not exists card_invites (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards(id)   on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  rsvp       text check (rsvp IS NULL OR rsvp in ('pending','accepted','declined')),
  created_at timestamptz default now(),
  unique(card_id, member_id)
);

-- Migration: make rsvp nullable (removes NOT NULL + DEFAULT 'pending'):
-- ALTER TABLE card_invites ALTER COLUMN rsvp DROP NOT NULL;
-- ALTER TABLE card_invites ALTER COLUMN rsvp DROP DEFAULT;

-- If upgrading an existing schema, run these to add the new columns:
-- alter table workspaces add column if not exists discord_client_id text;
-- alter table workspaces add column if not exists guild_id text;

-- ============================================================
-- Migration: if upgrading an existing database, run this once:
-- ALTER TABLE cards ALTER COLUMN notes TYPE jsonb USING NULL;
-- (This clears existing text notes; they cannot auto-convert to TipTap JSON.)
-- ============================================================

-- Indexes
create index if not exists channels_workspace_idx  on channels(workspace_id);
create index if not exists cards_channel_idx        on cards(channel_id);
create index if not exists members_workspace_idx    on members(workspace_id);
create index if not exists card_invites_card_idx    on card_invites(card_id);
create index if not exists card_invites_member_idx  on card_invites(member_id);

-- Row Level Security
alter table workspaces    enable row level security;
alter table channels      enable row level security;
alter table cards         enable row level security;
alter table members       enable row level security;
alter table card_invites  enable row level security;

-- workspaces: owner only
create policy if not exists "workspaces_owner" on workspaces
  for all using (owner_id = auth.uid());

-- channels: owner of the parent workspace
create policy if not exists "channels_workspace_owner" on channels
  for all using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
    )
  );

-- cards: owner of the workspace that contains the channel
create policy if not exists "cards_workspace_owner" on cards
  for all using (
    channel_id in (
      select id from channels where workspace_id in (
        select id from workspaces where owner_id = auth.uid()
      )
    )
  );

-- members: owner of the parent workspace
create policy if not exists "members_workspace_owner" on members
  for all using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
    )
  );

-- card_invites: owner of the workspace that contains the card
create policy if not exists "card_invites_owner" on card_invites
  for all using (
    card_id in (
      select id from cards where channel_id in (
        select id from channels where workspace_id in (
          select id from workspaces where owner_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- Migration for EXISTING databases — run once in SQL editor:
-- ============================================================
-- alter table workspaces add column if not exists guild_id text;
--
-- Drop old policy names (if they were created without IF NOT EXISTS):
-- drop policy if exists "channels_owner"     on channels;
-- drop policy if exists "cards_owner"        on cards;
-- drop policy if exists "members_owner"      on members;
--
-- Then re-create with the definitions above, e.g.:
-- create policy if not exists "channels_workspace_owner" on channels
--   for all using (
--     workspace_id in (select id from workspaces where owner_id = auth.uid())
--   );
-- (repeat for cards, members, card_invites)
-- ============================================================
