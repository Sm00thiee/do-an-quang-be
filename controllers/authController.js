const { supabase, supabaseAdmin } = require('../config/supabase');

// Helper function to get province/district IDs
async function getLocationIds(provinceCode, districtCode) {
  let provinceId = null;
  let districtId = null;

  if (provinceCode) {
    const { data: province } = await supabase
      .from('provinces')
      .select('id')
      .eq('code', provinceCode)
      .single();
    provinceId = province?.id;
  }

  if (districtCode && provinceId) {
    const { data: district } = await supabase
      .from('districts')
      .select('id')
      .eq('code', districtCode)
      .eq('province_id', provinceId)
      .single();
    districtId = district?.id;
  }

  return { provinceId, districtId };
}

// Helper function to process business fields and company descriptions
// Helper function to process business fields and company descriptions
async function processMultiSelectFields(userId, businessFields = [], companyDescriptions = []) {
  // Process business fields
  if (businessFields.length > 0) {
    const { data: businessFieldIds } = await supabaseAdmin
      .from('business_fields')
      .select('id, code')
      .in('code', businessFields);

    if (businessFieldIds?.length > 0) {
      const userBusinessFields = businessFieldIds.map(field => ({
        user_id: userId,
        business_field_id: field.id
      }));

      await supabaseAdmin
        .from('user_business_fields')
        .insert(userBusinessFields);
    }
  }

  // Process company descriptions
  if (companyDescriptions.length > 0) {
    const { data: companyDescIds } = await supabaseAdmin
      .from('company_descriptions')
      .select('id, code')
      .in('code', companyDescriptions);

    if (companyDescIds?.length > 0) {
      const userCompanyDescs = companyDescIds.map(desc => ({
        user_id: userId,
        company_description_id: desc.id
      }));

      await supabaseAdmin
        .from('user_company_descriptions')
        .insert(userCompanyDescs);
    }
  }
}

// Đăng ký người dùng mới với form phức tạp
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      province,
      district,
      role = 'candidate',
      companyName,
      businessField = [],
      companyDescription = [],
      knowAboutUs,
      lookingFor,
      salaryRange,
      companySize
    } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc: email, password, firstName, lastName'
      });
    }

    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email không đúng định dạng'
      });
    }

    // Validation password
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Mật khẩu phải có ít nhất 8 ký tự'
      });
    }

    // Validation phone
    if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
      return res.status(400).json({
        error: 'Số điện thoại không hợp lệ'
      });
    }

    // Validation date of birth
    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      return res.status(400).json({
        error: 'Ngày sinh không hợp lệ'
      });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Get location IDs
    const { provinceId, districtId } = await getLocationIds(province, district);

    // Đăng ký với Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      console.error('Lỗi đăng ký Supabase:', error);

      if (error.message.includes('already registered')) {
        return res.status(400).json({
          error: 'Email này đã được đăng ký'
        });
      }

      return res.status(400).json({
        error: error.message || 'Có lỗi xảy ra khi đăng ký'
      });
    }

    // Tạo user profile với thông tin đầy đủ
    if (data.user) {
      try {
        // Insert user profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert([
            {
              id: data.user.id,
              email: email.toLowerCase(),
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: fullName,
              phone: phone || null,
              date_of_birth: dateOfBirth || null,
              gender: gender || null,
              address: address || null,
              province_id: provinceId,
              district_id: districtId,
              role: role,
              know_about_us: knowAboutUs || null,
              looking_for: lookingFor || null,
              salary_range: salaryRange || null
            }
          ]);

        if (profileError) {
          console.error('Lỗi tạo profile:', profileError);
          throw profileError;
        }

        // Process business fields and company descriptions
        await processMultiSelectFields(data.user.id, businessField, companyDescription);

        // Create company if role is employer and companyName is provided
        if (role === 'employer' && companyName) {
          const { error: companyError } = await supabaseAdmin
            .from('companies')
            .insert([
              {
                name: companyName.trim(),
                size: companySize || null,
                address: address || null,
                province_id: provinceId,
                district_id: districtId,
                owner_id: data.user.id
              }
            ]);

          if (companyError) {
            console.warn('Lỗi tạo company:', companyError);
          }
        }

      } catch (profileErr) {
        console.error('Lỗi xử lý profile:', profileErr);
        return res.status(500).json({
          error: 'Tạo tài khoản thành công nhưng có lỗi xử lý thông tin profile'
        });
      }
    }

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName,
        role: role,
        emailConfirmed: data.user?.email_confirmed_at ? true : false
      }
    });

  } catch (error) {
    console.error('Lỗi server khi đăng ký:', error);
    res.status(500).json({
      error: 'Lỗi server nội bộ'
    });
  }
};

// Đăng nhập người dùng
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        error: 'Thiếu email hoặc password'
      });
    }

    // Đăng nhập với Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Lỗi đăng nhập Supabase:', error);

      // Xử lý các lỗi phổ biến
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          error: 'Email hoặc mật khẩu không đúng'
        });
      }

      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({
          error: 'Vui lòng xác thực email trước khi đăng nhập'
        });
      }

      return res.status(401).json({
        error: error.message || 'Có lỗi xảy ra khi đăng nhập'
      });
    }

    // Lấy thông tin profile từ database (nếu có)
    let userProfile = null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      userProfile = profile;
    } catch (profileErr) {
      console.warn('Không thể lấy profile:', profileErr);
    }

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: userProfile?.full_name || data.user.user_metadata?.full_name,
        role: userProfile?.role || data.user.user_metadata?.role || 'candidate',
        emailConfirmed: data.user.email_confirmed_at ? true : false
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Lỗi server khi đăng nhập:', error);
    res.status(500).json({
      error: 'Lỗi server nội bộ'
    });
  }
};

// Đăng xuất
const logout = async (req, res) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Đăng xuất với Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn('Lỗi khi đăng xuất:', error);
      }
    }

    res.json({
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Lỗi server khi đăng xuất:', error);
    res.status(500).json({
      error: 'Lỗi server nội bộ'
    });
  }
};

// Lấy thông tin user hiện tại
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // Đã được set bởi middleware authenticateToken

    // Lấy thông tin profile chi tiết
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name,
        role: profile?.role || user.user_metadata?.role || 'candidate',
        emailConfirmed: user.email_confirmed_at ? true : false,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({
      error: 'Lỗi server nội bộ'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};