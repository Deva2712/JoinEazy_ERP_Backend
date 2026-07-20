-- ─────────────────────────────────────────────────────────────────────────────
-- JoinEazy ERP — PostgreSQL init script
-- Runs AUTOMATICALLY on fresh volume (docker compose down -v && docker compose up)
-- Safe to re-run — all statements use IF NOT EXISTS / DO $$ EXCEPTION blocks
-- ─────────────────────────────────────────────────────────────────────────────

-- Revaluation ENUM types
DO $$ BEGIN
  CREATE TYPE "enum_revaluation_requests_priority" AS ENUM ('High', 'Mid', 'Low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_revaluation_requests_status" AS ENUM (
    'pending', 'under_review', 'accepted', 'rejected', 'resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Revaluation table
CREATE TABLE IF NOT EXISTS revaluation_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL,
  professor_id    UUID,
  subject         VARCHAR(255) NOT NULL,
  subject_code    VARCHAR(255),
  semester        VARCHAR(255),
  exam_type       VARCHAR(255),
  reason          TEXT,
  current_marks   FLOAT,
  revised_marks   FLOAT,
  max_marks       FLOAT,
  original_grade  VARCHAR(255),
  revised_grade   VARCHAR(255),
  priority        "enum_revaluation_requests_priority" NOT NULL DEFAULT 'Mid',
  status          "enum_revaluation_requests_status"   NOT NULL DEFAULT 'pending',
  remarks         TEXT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);