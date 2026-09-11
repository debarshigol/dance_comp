-- =========================================================================
-- DANCE COMPETITION SCORING & AUDIENCE VOTING PLATFORM - SUPABASE SCHEMA
-- Exactly 2 Competition Rounds with Competitors, Judges, and Unified Scores Table
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPETITORS / CANDIDATES TABLE
-- Stores: name, phone number, age, govt id type, govt id number, and photo
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  candidate_number TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  age INT NOT NULL,
  govt_id_type TEXT NOT NULL, -- 'Passport', 'Driving License', 'National ID / Aadhaar', 'State ID', 'Voter Card'
  govt_id_number TEXT NOT NULL,
  photo TEXT,
  category TEXT,
  style TEXT,
  song TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JUDGES TABLE (With ID and Password Credentials)
CREATE TABLE IF NOT EXISTS judges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  access_code TEXT UNIQUE NOT NULL, -- Login ID (e.g. JUDGE-MC99)
  password TEXT DEFAULT 'dance2026', -- Assigned Password
  status TEXT DEFAULT 'active',
  avatar TEXT,
  speciality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPETITION ROUNDS TABLE (Exactly 2 Rounds)
CREATE TABLE IF NOT EXISTS competition_rounds (
  id TEXT PRIMARY KEY, -- 'round-1', 'round-2'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'locked', 'upcoming', 'completed'
  judge_weightage INT DEFAULT 60,
  audience_weightage INT DEFAULT 40,
  is_current BOOLEAN DEFAULT FALSE,
  order_num INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UNIFIED SCORES TABLE (Stores both Judge Multi-Criteria Evaluations and Audience Votes)
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL REFERENCES competition_rounds(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('judge', 'audience')),
  judge_id TEXT REFERENCES judges(id) ON DELETE CASCADE, -- Populated if source_type = 'judge'
  voter_fingerprint TEXT, -- Populated if source_type = 'audience' for anti-abuse
  criteria JSONB, -- { "rhythm": 9.5, "choreography": 9.2, "expression": 9.8, "technique": 9.4, "stage_presence": 9.6 }
  raw_score NUMERIC(5,2), -- Calculated raw average (0-10) for judges or 1.0 for audience vote
  notes TEXT, -- Written commentary from judges
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast aggregation & realtime performance
CREATE INDEX IF NOT EXISTS idx_scores_round_source ON scores(round_id, source_type);
CREATE INDEX IF NOT EXISTS idx_scores_candidate ON scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_voter ON scores(round_id, voter_fingerprint);

-- ROW LEVEL SECURITY (RLS) POLICIES (Public read, authenticated / anon insert for live event)
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all event tables
CREATE POLICY "Public Read Competitors" ON competitors FOR SELECT USING (true);
CREATE POLICY "Public Read Judges" ON judges FOR SELECT USING (true);
CREATE POLICY "Public Read Rounds" ON competition_rounds FOR SELECT USING (true);
CREATE POLICY "Public Read Scores" ON scores FOR SELECT USING (true);

-- Allow public / anon manage for live scoring & voting
CREATE POLICY "Public Manage Scores" ON scores FOR ALL USING (true);
CREATE POLICY "Public Manage Competitors" ON competitors FOR ALL USING (true);
CREATE POLICY "Public Manage Judges" ON judges FOR ALL USING (true);
CREATE POLICY "Public Manage Rounds" ON competition_rounds FOR ALL USING (true);

-- Unique indexes to prevent duplicate scoring per round
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_judge_round_candidate ON scores(candidate_id, round_id, judge_id) WHERE source_type = 'judge';
CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_audience_round_voter ON scores(round_id, voter_fingerprint) WHERE source_type = 'audience';

-- =========================================================================
-- SQL VIEWS FOR REALTIME ROUND & CUMULATIVE SCORE CALCULATIONS
-- =========================================================================

-- View: Candidate Round Score Summary
CREATE OR REPLACE VIEW view_candidate_round_scores AS
SELECT 
  c.id AS candidate_id,
  c.candidate_number,
  c.name AS candidate_name,
  c.category,
  r.id AS round_id,
  r.name AS round_name,
  r.judge_weightage,
  r.audience_weightage,
  COALESCE(ROUND(AVG(CASE WHEN s.source_type = 'judge' THEN s.raw_score END), 2), 0) AS judge_raw_avg,
  COALESCE(ROUND((AVG(CASE WHEN s.source_type = 'judge' THEN s.raw_score END) / 10.0) * 100, 2), 0) AS judge_normalized_pct,
  COALESCE(ROUND(((AVG(CASE WHEN s.source_type = 'judge' THEN s.raw_score END) / 10.0) * 100) * (r.judge_weightage / 100.0), 2), 0) AS judge_weighted_pts,
  COUNT(CASE WHEN s.source_type = 'audience' THEN 1 END) AS audience_votes_count,
  ROUND(
    COALESCE(
      (COUNT(CASE WHEN s.source_type = 'audience' THEN 1 END)::NUMERIC / 
       NULLIF((SELECT COUNT(*) FROM scores WHERE round_id = r.id AND source_type = 'audience'), 0)::NUMERIC) * 100.0,
      0
    ), 2
  ) AS audience_vote_share_pct,
  ROUND(
    COALESCE(
      ((COUNT(CASE WHEN s.source_type = 'audience' THEN 1 END)::NUMERIC / 
        NULLIF((SELECT COUNT(*) FROM scores WHERE round_id = r.id AND source_type = 'audience'), 0)::NUMERIC) * 100.0) * (r.audience_weightage / 100.0),
      0
    ), 2
  ) AS audience_weighted_pts,
  ROUND(
    COALESCE(((AVG(CASE WHEN s.source_type = 'judge' THEN s.raw_score END) / 10.0) * 100) * (r.judge_weightage / 100.0), 0) +
    COALESCE(
      ((COUNT(CASE WHEN s.source_type = 'audience' THEN 1 END)::NUMERIC / 
        NULLIF((SELECT COUNT(*) FROM scores WHERE round_id = r.id AND source_type = 'audience'), 0)::NUMERIC) * 100.0) * (r.audience_weightage / 100.0),
      0
    ), 2
  ) AS round_final_score
FROM competitors c
CROSS JOIN competition_rounds r
LEFT JOIN scores s ON s.candidate_id = c.id AND s.round_id = r.id
GROUP BY c.id, c.candidate_number, c.name, c.category, r.id, r.name, r.judge_weightage, r.audience_weightage;

-- View: Final Cumulative Score Standings
CREATE OR REPLACE VIEW view_candidate_cumulative_scores AS
WITH r1 AS (
  SELECT candidate_id, round_final_score AS r1_score FROM view_candidate_round_scores WHERE round_id = 'round-1'
),
r2 AS (
  SELECT candidate_id, round_final_score AS r2_score FROM view_candidate_round_scores WHERE round_id = 'round-2'
)
SELECT 
  c.id AS candidate_id,
  c.candidate_number,
  c.name AS candidate_name,
  c.category,
  c.photo,
  COALESCE(r1.r1_score, 0) AS round_1_score,
  COALESCE(r2.r2_score, 0) AS round_2_score,
  ROUND(COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0), 2) AS total_points,
  ROUND((COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0)) / 2.0, 2) AS cumulative_score,
  DENSE_RANK() OVER (ORDER BY (COALESCE(r1.r1_score, 0) + COALESCE(r2.r2_score, 0)) DESC) AS rank
FROM competitors c
LEFT JOIN r1 ON r1.candidate_id = c.id
LEFT JOIN r2 ON r2.candidate_id = c.id;

-- =========================================================================
-- INITIAL SEED DATA FOR 2 COMPETITION ROUNDS
-- =========================================================================

-- Seed 2 Rounds
INSERT INTO competition_rounds (id, name, description, status, judge_weightage, audience_weightage, is_current, order_num)
VALUES
  ('round-1', 'Round 1: Preliminary Showcase & Technique', 'Opening performance round testing core musicality, synchronicity, and artistic expression.', 'active', 60, 40, true, 1),
  ('round-2', 'Round 2: Grand Finale Championship', 'The decisive championship finale where top dancers battle for the ultimate crown.', 'upcoming', 50, 50, false, 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  judge_weightage = EXCLUDED.judge_weightage,
  audience_weightage = EXCLUDED.audience_weightage,
  order_num = EXCLUDED.order_num;

-- Seed Competitors (with name, phone, age, govt_id_type, govt_id_number, photo)
INSERT INTO competitors (id, candidate_number, name, phone, age, govt_id_type, govt_id_number, photo, category, style, song, bio)
VALUES
  ('c-101', '#01', 'Maya Lin & The Pulse Duo', '+1 (555) 234-8901', 23, 'Passport', 'P7829104', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80', 'Duo / Contemporary', 'Contemporary & Lyrical Fusion', 'Ludovico Einaudi - Experience (Remix)', 'National contemporary champions bringing raw emotion, acrobatic lifts, and gravity-defying extensions.'),
  ('c-102', '#02', 'Kai "Vortex" Tanaka', '+1 (555) 345-6712', 19, 'Driving License', 'DL-CA-90281', 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80', 'Solo / Street & Popping', 'Animation, Popping & Tutting', 'Apashe - Lord & Master', 'Underground street battle icon known for microscopic muscle control, mechanical isolations, and robotic illusion choreography.'),
  ('c-103', '#03', 'Sofia Valenciaga', '+1 (555) 891-2345', 26, 'Passport', 'P5549021', 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80', 'Solo / Latin Ballroom Fusion', 'Salsa Con Fuego & Afro-Cuban Rumba', 'Marc Anthony - Vivir Mi Vida (Live Edit)', 'Internationally recognized ballroom soloist with rapid 180 BPM footwork, fierce spins, and fiery theatrical flair.'),
  ('c-104', '#04', 'Nova Syndicate Crew', '+1 (555) 678-9012', 22, 'National ID', 'NID-8819024', 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80', 'Mega Crew (8 Dancers)', 'Urban Hip-Hop & Krump Formations', 'Kendrick Lamar - DNA (Bass Edit)', '8-member powerhouse crew delivering synchronized explosions, intricate visual transitions, and chest-thumping energy.'),
  ('c-105', '#05', 'Aarav & Priya Sharma', '+1 (555) 456-7890', 25, 'Passport', 'P3301982', 'https://images.unsplash.com/photo-1509670811275-79453d576390?auto=format&fit=crop&w=800&q=80', 'Duo / Bollywood & Semi-Classical', 'Kathak-Contemporary Synthesis', 'A.R. Rahman - Jai Ho (Orchestral Reimagining)', 'Blending centuries-old classical Indian chakkars (pirouettes) and storytelling with modern cinematic flow.'),
  ('c-106', '#06', 'Elena & Damian Vance', '+1 (555) 789-0123', 29, 'Driving License', 'DL-NY-44810', 'https://images.unsplash.com/photo-1545959570-a9446733ec60?auto=format&fit=crop&w=800&q=80', 'Duo / Argentine Tango', 'Nuevo Tango Escenario', 'Astor Piazzolla - Libertango', 'Dramatic tango virtuosos featuring breathtaking ganchos, passionate boleos, and razor-sharp synchronicity.')
ON CONFLICT (id) DO NOTHING;

-- Seed Judges (with login passwords)
INSERT INTO judges (id, name, title, email, access_code, password, status, avatar, speciality)
VALUES
  ('j-01', 'Marcus Chen', 'Head Choreography Master & World Dance Judge', 'marcus.chen@dancefest.org', 'JUDGE-MC99', 'dance2026', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'Choreography & Musicality'),
  ('j-02', 'Elena Rostova', 'Prima Ballerina & International Technique Critic', 'elena.rostova@dancefest.org', 'JUDGE-ER42', 'dance2026', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'Classical Technique & Lines'),
  ('j-03', 'Tariq "Apex" Vance', 'Street Dance Legend & Freestyle Pioneer', 'apex.vance@dancefest.org', 'JUDGE-TV77', 'dance2026', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 'Stage Presence & Flow')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for all tables in publication
ALTER PUBLICATION supabase_realtime ADD TABLE competitors;
ALTER PUBLICATION supabase_realtime ADD TABLE judges;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
