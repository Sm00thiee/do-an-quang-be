const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Get all provinces
router.get('/provinces', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('provinces')
      .select('code, name')
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách tỉnh thành'
    });
  }
});

// Get districts by province
router.get('/districts/:provinceCode', async (req, res) => {
  try {
    const { provinceCode } = req.params;

    const { data, error } = await supabase
      .from('districts')
      .select(`
        code, 
        name,
        provinces(code, name)
      `)
      .eq('provinces.code', provinceCode)
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách quận huyện'
    });
  }
});

// Get all business fields
router.get('/business-fields', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_fields')
      .select('code, name, description')
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching business fields:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách lĩnh vực kinh doanh'
    });
  }
});

// Get all company descriptions
router.get('/company-descriptions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_descriptions')
      .select('code, name, description')
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching company descriptions:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách mô tả công ty'
    });
  }
});

// Get user profile with related data
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        provinces(code, name),
        districts(code, name),
        user_business_fields(
          business_fields(code, name)
        ),
        user_company_descriptions(
          company_descriptions(code, name)
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get company if user is employer
    let company = null;
    if (profile.role === 'employer') {
      const { data: companyData } = await supabase
        .from('companies')
        .select(`
          *,
          provinces(code, name),
          districts(code, name)
        `)
        .eq('owner_id', userId)
        .single();
      
      company = companyData;
    }

    res.json({
      success: true,
      data: {
        profile,
        company
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy thông tin profile'
    });
  }
});

module.exports = router;