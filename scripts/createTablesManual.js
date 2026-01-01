const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTableDirectly() {
  console.log('🚀 Creating tables using direct approach...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('✅ Supabase connected with service role');

  try {
    // Method 1: Try to insert a test record to see if table exists
    console.log('🧪 Testing if user_profiles table exists...');
    
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (testError && testError.code === 'PGRST106') {
      console.log('❌ Table does not exist');
      console.log('🔧 Manual creation required...');
      showManualSQL();
      return;
    }

    console.log('✅ user_profiles table already exists!');
    console.log('📊 Test query result:', testData);

  } catch (error) {
    console.log('❌ Error testing table:', error.message);
    console.log('🔧 Manual creation required...');
    showManualSQL();
  }
}

function showManualSQL() {
  console.log('\n📋 COPY VÀ PASTE SQL NÀY VÀO SUPABASE:');
  console.log('1. Truy cập: https://supabase.com/dashboard/project/odfesakcdvxqsvsldbou/editor');
  console.log('2. Chọn "SQL Editor"');
  console.log('3. Copy và paste đoạn SQL này và nhấn RUN:');
  
  console.log('\n--- START SQL ---');
  console.log(`
-- Tạo bảng user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100), 
  full_name VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  role VARCHAR(20) DEFAULT 'candidate',
  province_id INTEGER,
  district_id INTEGER,
  know_about_us TEXT,
  looking_for VARCHAR(255),
  salary_range VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng provinces
CREATE TABLE IF NOT EXISTS public.provinces (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng districts  
CREATE TABLE IF NOT EXISTS public.districts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  province_id INTEGER REFERENCES provinces(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng business_fields
CREATE TABLE IF NOT EXISTS public.business_fields (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng company_descriptions
CREATE TABLE IF NOT EXISTS public.company_descriptions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng companies
CREATE TABLE IF NOT EXISTS public.companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  size VARCHAR(20),
  address TEXT,
  province_id INTEGER REFERENCES provinces(id),
  district_id INTEGER REFERENCES districts(id),
  website VARCHAR(255),
  logo_url TEXT,
  owner_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo bảng user_business_fields
CREATE TABLE IF NOT EXISTS public.user_business_fields (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_field_id INTEGER REFERENCES business_fields(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, business_field_id)
);

-- Tạo bảng user_company_descriptions
CREATE TABLE IF NOT EXISTS public.user_company_descriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_description_id INTEGER REFERENCES company_descriptions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_description_id)
);

-- Enable RLS cho các bảng
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_business_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_descriptions ENABLE ROW LEVEL SECURITY;

-- Tạo policies cho user_profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tạo policies cho companies
CREATE POLICY IF NOT EXISTS "Users can view all companies" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Company owners can update their companies" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY IF NOT EXISTS "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Tạo policies cho user business fields
CREATE POLICY IF NOT EXISTS "Users can manage their own business fields" ON public.user_business_fields
  FOR ALL USING (auth.uid() = user_id);

-- Tạo policies cho user company descriptions  
CREATE POLICY IF NOT EXISTS "Users can manage their own company descriptions" ON public.user_company_descriptions
  FOR ALL USING (auth.uid() = user_id);
`);
  console.log('--- END SQL ---\n');
}

createTableDirectly();