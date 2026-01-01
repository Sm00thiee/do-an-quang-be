const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createBasicTables() {
  console.log('🚀 Creating basic tables...');

  // Check if SERVICE_ROLE_KEY is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình!');
    console.log('\n📋 Để lấy Service Role Key:');
    console.log('1. Truy cập: https://supabase.com/dashboard/project/odfesakcdvxqsvsldbou/settings/api');
    console.log('2. Copy "service_role" key (secret)');
    console.log('3. Cập nhật vào .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    console.log('\n🔧 HOẶC tạo bảng thủ công:');
    showManualInstructions();
    return;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Connecting to Supabase...');

    // Try creating user_profiles table first
    console.log('📝 Creating user_profiles table...');
    
    const createUserProfilesSQL = `
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

      -- Enable RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create policy
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = id);
        
      CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `;

    // Execute using direct SQL query
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error && error.code === 'PGRST204') {
      // Table doesn't exist, create it
      console.log('⚡ Table not found, creating...');
      
      // Use alternative approach - create via RPC if available
      try {
        const { error: rpcError } = await supabase.rpc('exec', {
          sql: createUserProfilesSQL
        });
        
        if (rpcError) {
          throw rpcError;
        }
      } catch (rpcErr) {
        console.log('⚠️ RPC method failed, trying alternative...');
        
        // Show manual instructions
        throw new Error('Automatic table creation failed');
      }
    }

    // Test table access
    console.log('🧪 Testing table access...');
    const { error: testError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Table access test failed:', testError.message);
      throw new Error('Table verification failed');
    }

    console.log('✅ user_profiles table ready!');
    console.log('🎉 Basic setup completed successfully!');
    
  } catch (error) {
    console.log('❌ Automatic setup failed:', error.message);
    console.log('\n📋 Manual setup required:');
    showManualInstructions();
  }
}

function showManualInstructions() {
  console.log('1. Truy cập Supabase Dashboard: https://supabase.com/dashboard/project/odfesakcdvxqsvsldbou/editor');
  console.log('2. Chọn "SQL Editor" và chạy câu lệnh sau:');
  console.log('\n--- COPY VÀ PASTE ĐOẠN SQL NÀY ---');
  console.log(`
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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
  `);
  console.log('--- END SQL ---\n');
  console.log('3. Nhấn "RUN" để tạo bảng');
  console.log('4. Restart server bằng: npm start');
}

createBasicTables();