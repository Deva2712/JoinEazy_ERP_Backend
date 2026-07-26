-- ─────────────────────────────────────────────────────────────────────────────
-- JoinEazy ERP — PostgreSQL init script
-- Runs AUTOMATICALLY on fresh volume (docker compose down -v && docker compose up)
-- Safe to re-run — all statements use IF NOT EXISTS / DO $$ EXCEPTION blocks
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Registrar ─────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "enum_registrar_requests_type" AS ENUM (
  'transcript','bonafide','migration','degree','other',
  'no_dues','character','conduct','lor',
  'provisional_transcript','transfer_certificate',
  'marksheet_10','marksheet_12','cmm'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_registrar_requests_status" AS ENUM ('pending','processing','ready','delivered','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_lor_requests_status"       AS ENUM ('pending','accepted','rejected','completed');          EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS registrar_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL,
  type                "enum_registrar_requests_type"   NOT NULL DEFAULT 'other',
  purpose             TEXT,
  status              "enum_registrar_requests_status" NOT NULL DEFAULT 'pending',
  remarks             TEXT,
  copies              INTEGER DEFAULT 1,
  urgency             VARCHAR(255),
  supporting_doc_url  VARCHAR(1000),
  "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lor_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL,
  professor_id        UUID,
  purpose             TEXT,
  university          VARCHAR(255),
  deadline            DATE,
  status              "enum_lor_requests_status" NOT NULL DEFAULT 'pending',
  remarks             TEXT,
  meeting_time        TIMESTAMP WITH TIME ZONE,
  supporting_doc_url  VARCHAR(1000),
  lor_file_url        VARCHAR(1000),
  "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Hostel ────────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "enum_hostel_leave_requests_status"        AS ENUM ('Pending','Approved','Rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_hostel_outing_requests_status"       AS ENUM ('Pending','Approved','Rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_hostel_maintenance_requests_priority" AS ENUM ('Low','Medium','High');          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_hostel_maintenance_requests_status"  AS ENUM ('Pending','In Progress','Resolved','Rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "enum_hostel_complaints_status"            AS ENUM ('Pending','Open','In Progress','Resolved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS hostel_room_allotments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL UNIQUE,
  block         VARCHAR(255),
  room_number   VARCHAR(255),
  type          VARCHAR(255),
  floor_number  VARCHAR(255),
  allotted_from TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL,
  from_date        DATE,
  from_time        VARCHAR(255),
  to_date          DATE,
  to_time          VARCHAR(255),
  reason           TEXT,
  parent_contact   VARCHAR(255),
  status           "enum_hostel_leave_requests_status" NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_outing_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL,
  date             DATE,
  out_time         VARCHAR(255),
  return_time      VARCHAR(255),
  purpose          TEXT,
  parent_contact   VARCHAR(255),
  status           "enum_hostel_outing_requests_status" NOT NULL DEFAULT 'Pending',
  current_step     INTEGER DEFAULT 0,
  rejection_reason TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_maintenance_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL,
  category    VARCHAR(255),
  description TEXT,
  priority    "enum_hostel_maintenance_requests_priority" NOT NULL DEFAULT 'Medium',
  status      "enum_hostel_maintenance_requests_status"   NOT NULL DEFAULT 'Pending',
  steps       JSON DEFAULT '[]',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_complaints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL,
  subject     VARCHAR(255),
  description TEXT,
  against     VARCHAR(255),
  status      "enum_hostel_complaints_status" NOT NULL DEFAULT 'Pending',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Cohort Meetings ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "enum_cohort_meetings_status" AS ENUM (
    'scheduled', 'ongoing', 'completed', 'cancelled', 'pending', 'accepted', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Cohort Meetings table
CREATE TABLE IF NOT EXISTS cohort_meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id       UUID NOT NULL,
  created_by      UUID NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  student_id      UUID,
  professor_id    UUID,
  professor_name  VARCHAR(255),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  meeting_url     VARCHAR(255),
  platform        VARCHAR(255) DEFAULT 'zoom',
  scheduled_at    TIMESTAMP WITH TIME ZONE,
  duration_mins   INTEGER DEFAULT 60,
  status          "enum_cohort_meetings_status" NOT NULL DEFAULT 'scheduled',
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

-- ── Mentoring: enums ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "enum_mentor_sessions_mode" AS ENUM ('Offline', 'Online');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_mentor_sessions_status" AS ENUM (
    'pending', 'accepted', 'completed', 'cancelled', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Mentoring: mentor_sessions (meetings) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id           UUID NOT NULL,
  mentee_id           UUID NOT NULL,
  title               VARCHAR(255) NOT NULL,
  scheduled_at        TIMESTAMP WITH TIME ZONE NOT NULL,
  mode                "enum_mentor_sessions_mode"   NOT NULL DEFAULT 'Offline',
  status              "enum_mentor_sessions_status" NOT NULL DEFAULT 'pending',
  notes               TEXT,
  meet_link           VARCHAR(255),
  location            VARCHAR(255),
  reschedule_date     TIMESTAMP WITH TIME ZONE,
  rejection_reason    TEXT,
  has_attended        BOOLEAN,
  discussion_summary  TEXT,
  action_plan         JSON,
  performance_ratings JSON,
  overall_remarks     TEXT,
  "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Mentoring: mentor_feedback ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID,
  mentor_id   UUID NOT NULL,
  mentee_id   UUID NOT NULL,
  rating      INTEGER NOT NULL,
  feedback    TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── Mentoring: mentor_assignments (source of truth: student ↔ mentor) ───────
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL,
  mentor_id    UUID NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  assigned_by  UUID,
  assigned_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Only one ACTIVE mentor per student at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_assignment_per_student
  ON mentor_assignments (student_id)
  WHERE is_active = true;
  
  -- ── Marks Management: mark_columns ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mark_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   VARCHAR(255) NOT NULL,  -- references cohorts.id (Cohort.id is a string, not UUID type)
  name        VARCHAR(255) NOT NULL,
  max_marks   FLOAT,
  weightage   FLOAT,
  is_final    BOOLEAN NOT NULL DEFAULT false,
  credits     INTEGER,       -- set on the Final column: how many credits this course is worth
  semester    INTEGER,       -- set on the Final column: which semester this course belongs to
  result_date DATE,          -- set on the Final column: when results become visible to students
  position    INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mark_columns_course_id ON mark_columns (course_id);

-- ── Marks Management: student_marks ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_marks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id       UUID NOT NULL,
  student_id      VARCHAR(255) NOT NULL,  -- references cohort_participants.user_id
  marks_obtained  FLOAT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_mark_per_student_column
  ON student_marks (column_id, student_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_student_id ON student_marks (student_id);

-- ── If mark_columns already exists from an earlier version, add the new columns ──
ALTER TABLE mark_columns ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE mark_columns ADD COLUMN IF NOT EXISTS result_date DATE;
ALTER TABLE mark_columns ADD COLUMN IF NOT EXISTS semester INTEGER;