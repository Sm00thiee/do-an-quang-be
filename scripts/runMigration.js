const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  // Check if SERVICE_ROLE_KEY is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình!');
    console.log('📋 Hướng dẫn setup thủ công:');
    console.log('1. Vào Supabase Dashboard > Settings > API');
    console.log('2. Copy service_role key');
    console.log('3. Cập nhật SUPABASE_SERVICE_ROLE_KEY trong .env');
    console.log('\n🔧 HOẶC chạy SQL thủ công:');
    console.log('1. Vào Supabase Dashboard > SQL Editor');
    console.log('2. Copy và chạy nội dung file scripts/01_create_tables.sql');
    console.log('3. Copy và chạy nội dung file scripts/02_seed_data.sql');
    return;
  }

  try {
    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Supabase client initialized with service role');

    // Read SQL files
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, '01_create_tables.sql'), 
      'utf8'
    );
    
    const seedDataSQL = fs.readFileSync(
      path.join(__dirname, '02_seed_data.sql'), 
      'utf8'
    );

    console.log('📝 Executing table creation...');
    
    // Try to create tables using simple query execution
    try {
      // Simple table creation - just create user_profiles first
      const createUserProfilesQuery = `
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
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const { error: profileError } = await supabase.rpc('exec', {
        sql: createUserProfilesQuery
      });

      if (profileError && !profileError.message.includes('already exists')) {
        throw profileError;
      }

      console.log('✅ user_profiles table created successfully');

      // Test if table exists by trying to select from it
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (testError) {
        console.log('⚠️ Table test failed, trying alternative approach...');
        throw new Error('Table creation verification failed');
      }

      console.log('✅ Table verification successful');

    } catch (error) {
      console.log('❌ Automatic migration failed:', error.message);
      console.log('\n📋 Manual setup required:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and run the content of scripts/01_create_tables.sql');
      console.log('3. Copy and run the content of scripts/02_seed_data.sql');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run the content of scripts/01_create_tables.sql');
    console.log('3. Copy and run the content of scripts/02_seed_data.sql');
  }
}

runMigration();