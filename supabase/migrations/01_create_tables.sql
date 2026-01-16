-- ==============================================
-- CREATE DATABASE SCHEMA FOR RECRUITMENT WEB
-- ==============================================

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- 1. CREATE ENUM TYPES
CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE company_size_type AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');

-- 2. PROVINCES TABLE
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    province_id INTEGER REFERENCES provinces(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. BUSINESS FIELDS TABLE
CREATE TABLE IF NOT EXISTS business_fields (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. COMPANY DESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS company_descriptions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. USER PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender gender_type,
    address TEXT,
    province_id INTEGER REFERENCES provinces(id),
    district_id INTEGER REFERENCES districts(id),
    role user_role DEFAULT 'candidate',
    avatar_url TEXT,
    know_about_us TEXT,
    looking_for VARCHAR(255),
    salary_range VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    size company_size_type,
    address TEXT,
    province_id INTEGER REFERENCES provinces(id),
    district_id INTEGER REFERENCES districts(id),
    website VARCHAR(255),
    logo_url TEXT,
    owner_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. USER BUSINESS FIELDS (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_business_fields (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    business_field_id INTEGER REFERENCES business_fields(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, business_field_id)
);

-- 9. USER COMPANY DESCRIPTIONS (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_company_descriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_description_id INTEGER REFERENCES company_descriptions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, company_description_id)
);

-- ==============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_province ON user_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_districts_province ON districts(province_id);

-- ==============================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- User Profiles Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Companies Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all companies" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Company owners can update their companies" ON companies
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Many-to-Many tables policies
ALTER TABLE user_business_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business fields" ON user_business_fields
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own company descriptions" ON user_company_descriptions
    FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE companies IS 'Company information for employers';
COMMENT ON TABLE business_fields IS 'Available business fields/industries';
COMMENT ON TABLE company_descriptions IS 'Company description categories';