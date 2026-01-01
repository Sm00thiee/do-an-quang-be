-- =====================================================
-- ROADMAP TABLES MIGRATION
-- Chạy file này trong Supabase SQL Editor
-- =====================================================

-- 1. Table: roadmaps (Lộ trình chính)
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- marketing, it, design, etc.
    status VARCHAR(50) DEFAULT 'active', -- active, archived, draft
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_public BOOLEAN DEFAULT false,
    total_sections INTEGER DEFAULT 0,
    completed_sections INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: roadmap_sections (Các phần của lộ trình - Level 1)
CREATE TABLE IF NOT EXISTS roadmap_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(20) DEFAULT '#0066FF',
    icon VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- completed, in-progress, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: roadmap_lessons (Bài học trong section - Level 2)
CREATE TABLE IF NOT EXISTS roadmap_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES roadmap_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB, -- Nội dung chi tiết dạng JSON
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- completed, in-progress, pending
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: roadmap_skills (Các kỹ năng trong lesson)
CREATE TABLE IF NOT EXISTS roadmap_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES roadmap_lessons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table: roadmap_resources (Tài nguyên học tập)
CREATE TABLE IF NOT EXISTS roadmap_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES roadmap_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT,
    type VARCHAR(50), -- video, article, course, book
    is_completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table: user_roadmap_progress (Theo dõi tiến độ user)
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES roadmap_lessons(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES roadmap_skills(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES roadmap_resources(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, lesson_id),
    UNIQUE(user_id, skill_id),
    UNIQUE(user_id, resource_id)
);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_category ON roadmaps(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_sections_roadmap_id ON roadmap_sections(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_lessons_section_id ON roadmap_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_skills_lesson_id ON roadmap_skills(lesson_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_resources_lesson_id ON roadmap_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_roadmap_progress(user_id);

-- =====================================================
-- TRIGGERS for auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roadmaps_updated_at
    BEFORE UPDATE ON roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_sections_updated_at
    BEFORE UPDATE ON roadmap_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_lessons_updated_at
    BEFORE UPDATE ON roadmap_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION to calculate roadmap progress
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_roadmap_progress(roadmap_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress_percent INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_lessons
    FROM roadmap_lessons rl
    JOIN roadmap_sections rs ON rl.section_id = rs.id
    WHERE rs.roadmap_id = roadmap_uuid;
    
    SELECT COUNT(*) INTO completed_lessons
    FROM roadmap_lessons rl
    JOIN roadmap_sections rs ON rl.section_id = rs.id
    WHERE rs.roadmap_id = roadmap_uuid AND rl.status = 'completed';
    
    IF total_lessons > 0 THEN
        progress_percent := (completed_lessons * 100) / total_lessons;
    ELSE
        progress_percent := 0;
    END IF;
    
    -- Update the roadmap with new progress
    UPDATE roadmaps 
    SET progress = progress_percent,
        total_sections = (SELECT COUNT(*) FROM roadmap_sections WHERE roadmap_id = roadmap_uuid),
        completed_sections = (SELECT COUNT(*) FROM roadmap_sections WHERE roadmap_id = roadmap_uuid AND status = 'completed')
    WHERE id = roadmap_uuid;
    
    RETURN progress_percent;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roadmap_progress ENABLE ROW LEVEL SECURITY;

-- Policies for roadmaps: Users can CRUD their own roadmaps
CREATE POLICY "Users can view their own roadmaps" ON roadmaps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public roadmaps" ON roadmaps
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own roadmaps" ON roadmaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps" ON roadmaps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" ON roadmaps
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for sections: Based on roadmap ownership
CREATE POLICY "Users can manage sections of their roadmaps" ON roadmap_sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
    );

-- Policies for lessons: Based on roadmap ownership
CREATE POLICY "Users can manage lessons of their roadmaps" ON roadmap_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM roadmap_sections rs
            JOIN roadmaps r ON rs.roadmap_id = r.id
            WHERE rs.id = section_id AND r.user_id = auth.uid()
        )
    );

-- Policies for skills and resources: Based on roadmap ownership
CREATE POLICY "Users can manage skills of their roadmaps" ON roadmap_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM roadmap_lessons rl
            JOIN roadmap_sections rs ON rl.section_id = rs.id
            JOIN roadmaps r ON rs.roadmap_id = r.id
            WHERE rl.id = lesson_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage resources of their roadmaps" ON roadmap_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM roadmap_lessons rl
            JOIN roadmap_sections rs ON rl.section_id = rs.id
            JOIN roadmaps r ON rs.roadmap_id = r.id
            WHERE rl.id = lesson_id AND r.user_id = auth.uid()
        )
    );

-- Policies for progress tracking
CREATE POLICY "Users can manage their own progress" ON user_roadmap_progress
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- =====================================================
-- Uncomment below to add sample roadmap for testing
/*
INSERT INTO roadmaps (user_id, title, description, category, status, progress)
VALUES (
    'your-user-id-here',
    'Lộ trình Marketing Digital',
    'Lộ trình phát triển sự nghiệp từ Junior đến Senior Marketing',
    'marketing',
    'active',
    30
);
*/

-- =====================================================
-- GRANT PERMISSIONS (for service role)
-- =====================================================
GRANT ALL ON roadmaps TO service_role;
GRANT ALL ON roadmap_sections TO service_role;
GRANT ALL ON roadmap_lessons TO service_role;
GRANT ALL ON roadmap_skills TO service_role;
GRANT ALL ON roadmap_resources TO service_role;
GRANT ALL ON user_roadmap_progress TO service_role;
