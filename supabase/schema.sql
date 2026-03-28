   sql
-- VERITAS Supabase Schema
-- Run this in your Supabase SQL Editor to create the reports table.

CREATE TABLE IF NOT EXISTS reports (
    uuid          TEXT PRIMARY KEY,
    timestamp     TIMESTAMPTZ NOT NULL,
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    tier          TEXT NOT NULL CHECK (tier IN ('None', 'Minor', 'Moderate', 'Major', 'Total Collapse')),
    infra_type    TEXT NOT NULL CHECK (infra_type IN ('Residential', 'Road', 'Bridge', 'Utility', 'Medical', 'School')),
    loc_mode      TEXT NOT NULL CHECK (loc_mode IN ('precise', 'fuzzy')),
    dci           DOUBLE PRECISION NOT NULL,
    dci_tier      TEXT NOT NULL CHECK (dci_tier IN ('high', 'watch', 'review')),
    dci_pes       DOUBLE PRECISION,
    dci_cor       DOUBLE PRECISION,
    dci_tfr       DOUBLE PRECISION,
    dci_cci       DOUBLE PRECISION,
    photo_ai_score DOUBLE PRECISION,
    photo_ai_conf  DOUBLE PRECISION,
    synced        BOOLEAN DEFAULT true   -- true = already synced; false = pending sync
);

-- Index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_reports_geo ON reports (lat, lng);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports (timestamp);

-- Optional: row level security (RLS) enabled; allow public insert but restrict select to authenticated users
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (but we rely on edge function to strip IP)
CREATE POLICY "Allow anonymous inserts" ON reports
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can read (for responder dashboard)
CREATE POLICY "Allow authenticated reads" ON reports
    FOR SELECT USING (auth.role() = 'authenticated');