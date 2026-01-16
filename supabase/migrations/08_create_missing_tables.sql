-- ==============================================
-- MISSING TABLES MIGRATION
-- Applications, Saved Jobs, AI Chat, User Preferences
-- ==============================================

-- 1. APPLICATIONS TABLE - Quản lý hồ sơ ứng tuyển
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cv_url TEXT,
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, rejected, interviewed, hired
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES user_profiles(id),
    notes TEXT,
    UNIQUE(job_id, candidate_id)
);

-- 2. SAVED JOBS TABLE - Lưu việc làm yêu thích
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 3. AI CHAT HISTORY TABLE - Lưu lịch sử chat (Candidate only)
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER PREFERENCES TABLE - AI Personalization
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    career_goal TEXT,
    preferred_industries JSONB,
    preferred_locations JSONB,
    salary_expectation_from INTEGER,
    salary_expectation_to INTEGER,
    job_type_preferences JSONB,
    ai_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==============================================
-- INDEXES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_session_id ON ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ==============================================
-- TRIGGERS
-- ==============================================
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Applications Policies
CREATE POLICY "Candidates can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Employers can view applications for their jobs" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.id = job_id AND c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Employers can update applications for their jobs" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.id = job_id AND c.owner_id = auth.uid()
        )
    );

-- Saved Jobs Policies
CREATE POLICY "Users can view their own saved jobs" ON saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved jobs" ON saved_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- AI Chat History Policies
CREATE POLICY "Users can view their own chat history" ON ai_chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat messages" ON ai_chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================
GRANT ALL ON applications TO service_role;
GRANT ALL ON saved_jobs TO service_role;
GRANT ALL ON ai_chat_history TO service_role;
GRANT ALL ON user_preferences TO service_role;

COMMENT ON TABLE applications IS 'Job applications submitted by candidates';
COMMENT ON TABLE saved_jobs IS 'Jobs saved by users for later viewing';
COMMENT ON TABLE ai_chat_history IS 'AI chatbot conversation history';
COMMENT ON TABLE user_preferences IS 'User career preferences for AI personalization';
