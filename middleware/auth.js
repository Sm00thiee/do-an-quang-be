const { supabaseAdmin } = require('../config/supabase');

// Middleware xác thực JWT token từ Supabase Auth
// Token này được frontend gửi lên từ Supabase client
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token truy cập không được cung cấp' 
      });
    }

    // Xác thực token với Supabase Admin client
    // Điều này verify JWT signature và trích xuất thông tin user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Token validation error:', error);
      return res.status(403).json({ 
        error: 'Token không hợp lệ hoặc đã hết hạn' 
      });
    }

    // Gắn thông tin user vào request để các route handlers sử dụng
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Lỗi xác thực token:', error);
    return res.status(403).json({ 
      error: 'Token không hợp lệ' 
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Chưa xác thực người dùng' 
      });
    }

    // Kiểm tra role trong database
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Không có quyền truy cập. Yêu cầu quyền admin' 
      });
    }

    next();
  } catch (error) {
    console.error('Lỗi kiểm tra quyền admin:', error);
    return res.status(500).json({ 
      error: 'Lỗi server khi kiểm tra quyền' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin
};