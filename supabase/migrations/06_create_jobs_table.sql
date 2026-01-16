-- ==============================================
-- JOBS TABLE MIGRATION
-- ==============================================

-- 1. Table: jobs
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_from INTEGER,
    salary_to INTEGER,
    salary_secret BOOLEAN DEFAULT false,
    currency VARCHAR(10) DEFAULT 'VND',
    
    quantity INTEGER DEFAULT 1,
    role VARCHAR(100), -- Vị trí: Nhân viên, Trưởng phòng...
    experience_required VARCHAR(100), -- 1 năm, không yêu cầu...
    gender_required VARCHAR(20) DEFAULT 'any', -- male, female, any (sửa lại để khớp với FE nếu cần)
    
    deadline DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, closed, pending, hidden
    views INTEGER DEFAULT 0,
    
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    province_id INTEGER REFERENCES provinces(id),
    district_id INTEGER REFERENCES districts(id),
    address TEXT, -- Địa chỉ cụ thể
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: job_business_fields (Nhiều ngành nghề cho 1 job)
CREATE TABLE IF NOT EXISTS job_business_fields (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    business_field_id INTEGER NOT NULL REFERENCES business_fields(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, business_field_id)
);

-- 3. Table: job_types (Full-time, Part-time...)
-- Nếu muốn lưu bảng riêng thì tạo bảng job_type_master giống business_fields
-- Nhưng để đơn giản, có thể lưu string vào jobs hoặc tạo bảng liên kết.
-- Giả sử ta tạo bảng master trước:
CREATE TABLE IF NOT EXISTS job_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Job Types
INSERT INTO job_types (code, name) VALUES
('full-time', 'Toàn thời gian'),
('part-time', 'Bán thời gian'),
('internship', 'Thực tập'),
('freelance', 'Freelance'),
('remote', 'Remote')
ON CONFLICT (code) DO NOTHING;

-- Link Jobs <-> Job Types
CREATE TABLE IF NOT EXISTS job_job_types (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    job_type_id INTEGER NOT NULL REFERENCES job_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, job_type_id)
);

-- 4. Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_business_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_job_types ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Ai cũng xem được job active
CREATE POLICY "Public read active jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- Employer xem được job của mình (kể cả đóng/ẩn)
CREATE POLICY "Employer manage own jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid()
        )
    );

-- Trigger updated_at
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Permission for role
GRANT ALL ON jobs TO service_role;
GRANT ALL ON job_business_fields TO service_role;
GRANT ALL ON job_types TO service_role;
GRANT ALL ON job_job_types TO service_role;
GRANT USAGE, SELECT ON SEQUENCE jobs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE job_business_fields_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE job_job_types_id_seq TO service_role;
