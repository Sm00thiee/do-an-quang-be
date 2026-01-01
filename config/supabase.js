const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Kiểm tra các biến môi trường cần thiết
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY. ' +
    'Vui lòng kiểm tra file .env'
  );
}

// Tạo Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tạo Supabase client cho admin (với service role key)
const createAdminClient = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY không được cấu hình');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const supabaseAdmin = createAdminClient();

module.exports = {
  supabase,
  supabaseAdmin
};