-- ============================================================
-- Archon Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGS TABLE — one row, configured on first deploy
-- ============================================================
CREATE TABLE IF NOT EXISTS orgs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name            varchar(255) NOT NULL,
    github_org_slug     varchar(255) NOT NULL,
    github_access_token text NOT NULL,          -- encrypted at app level (AES-256-GCM)
    join_code           varchar(10) UNIQUE,           -- magic invite code (like MS Teams)
    is_configured       boolean DEFAULT false,
    created_at          timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username                varchar(100) NOT NULL,
    email                   varchar(255) UNIQUE,
    password                text,                       -- null for OAuth-only users
    auth_provider           varchar(50),                -- 'github', 'google', 'local'

    -- GitHub identity
    github_id               varchar(255) UNIQUE,
    github_username         varchar(100),
    github_access_token     text,                       -- encrypted at app level (AES-256-GCM)
    github_avatar_url       text,
    github_token_scope      varchar(500),

    -- Profile
    avatar                  text,
    first_name              varchar(100),
    last_name               varchar(100),
    bio                     text,

    -- Archon RBAC
    kachow_role             varchar(50) DEFAULT 'engineer',  -- admin / engineer / viewer
    team                    varchar(255),                     -- assigned by admin
    org_id                  uuid REFERENCES orgs(id),

    -- Legacy fields (kept for backward compat)
    role                    varchar(50),
    onboarding_completed    boolean DEFAULT false,
    default_org_id          uuid,

    -- Status
    is_active               boolean DEFAULT true,
    is_verified             boolean DEFAULT false,
    first_login_at          timestamptz,
    last_login_at           timestamptz,
    last_seen_at            timestamptz,

    created_at              timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at              timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Project info
    name                varchar(255) NOT NULL,
    description         text,

    -- GitHub integration (per-project scoped PAT)
    github_repo         varchar(255) NOT NULL,
    github_pat          text NOT NULL,

    -- Status
    status              varchar(50) DEFAULT 'active',
    last_run_at         timestamptz,

    created_at          timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, github_repo)
);

-- ============================================================
-- KNOWLEDGE SOURCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  uuid REFERENCES orgs(id) ON DELETE CASCADE,
    source_type             varchar(50) NOT NULL,       -- 'slack' or 'github'
    config                  jsonb NOT NULL DEFAULT '{}', -- token, channels, repos, options
    last_synced_at          timestamptz,
    status                  varchar(50) DEFAULT 'never_synced', -- connected / error / never_synced
    documents_ingested_count integer DEFAULT 0,
    sync_error              text,
    created_at              timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at              timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- KNOWLEDGE DOCUMENTS TABLE — raw ingested content
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           uuid REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    title               varchar(500),
    content             text,
    metadata            jsonb DEFAULT '{}',          -- channel, repo, file path, etc.
    ingested_at         timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_org ON knowledge_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_source ON knowledge_documents(source_id);

-- ============================================================
-- LEARNING PATHS TABLE — AI-generated onboarding paths
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
    org_id          uuid REFERENCES orgs(id) ON DELETE CASCADE,
    role            varchar(100) NOT NULL,
    title           varchar(500) NOT NULL,
    description     text,
    modules         jsonb NOT NULL DEFAULT '[]',
    status          varchar(50) DEFAULT 'active',
    progress_pct    integer DEFAULT 0,
    created_at      timestamptz DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STARTER TASKS TABLE — practical tasks linked to knowledge graph
-- ============================================================
CREATE TABLE IF NOT EXISTS starter_tasks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
    title            varchar(500) NOT NULL,
    description      text,
    difficulty       varchar(20) DEFAULT 'easy',
    linked_nodes     jsonb DEFAULT '[]',
    hints            jsonb DEFAULT '[]',
    status           varchar(50) DEFAULT 'pending',
    completed_at     timestamptz,
    created_at       timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_org ON learning_paths(org_id);
CREATE INDEX IF NOT EXISTS idx_starter_tasks_path ON starter_tasks(learning_path_id);