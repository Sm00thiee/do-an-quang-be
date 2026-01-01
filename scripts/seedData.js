const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function seedData() {
  console.log('🌱 Seeding data...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Seed provinces
    console.log('📍 Seeding provinces...');
    const provinces = [
      { code: 'hanoi', name: 'Hà Nội' },
      { code: 'hcm', name: 'Hồ Chí Minh' },
      { code: 'danang', name: 'Đà Nẵng' },
      { code: 'haiphong', name: 'Hải Phòng' },
      { code: 'cantho', name: 'Cần Thơ' }
    ];

    const { error: provinceError } = await supabase
      .from('provinces')
      .upsert(provinces, { onConflict: 'code' });

    if (provinceError) {
      console.log('⚠️ Province seeding error:', provinceError.message);
    } else {
      console.log('✅ Provinces seeded successfully');
    }

    // Get Hanoi ID for districts
    const { data: hanoiProvince } = await supabase
      .from('provinces')
      .select('id')
      .eq('code', 'hanoi')
      .single();

    if (hanoiProvince) {
      // Seed districts for Hanoi
      console.log('🏘️ Seeding districts...');
      const districts = [
        { code: 'ba-dinh', name: 'Ba Đình', province_id: hanoiProvince.id },
        { code: 'hoan-kiem', name: 'Hoàn Kiếm', province_id: hanoiProvince.id },
        { code: 'dong-da', name: 'Đống Đa', province_id: hanoiProvince.id },
        { code: 'cau-giay', name: 'Cầu Giấy', province_id: hanoiProvince.id }
      ];

      const { error: districtError } = await supabase
        .from('districts')
        .upsert(districts, { onConflict: 'code' });

      if (districtError) {
        console.log('⚠️ District seeding error:', districtError.message);
      } else {
        console.log('✅ Districts seeded successfully');
      }
    }

    // Seed business fields
    console.log('💼 Seeding business fields...');
    const businessFields = [
      { code: 'cong-nghe', name: 'Công nghệ thông tin', description: 'Lập trình, phát triển phần mềm, AI, blockchain' },
      { code: 'tu-van', name: 'Tư vấn', description: 'Tư vấn kinh doanh, quản lý, chiến lược' },
      { code: 'marketing', name: 'Marketing & Quảng cáo', description: 'Digital marketing, content, social media' },
      { code: 'tai-chinh', name: 'Tài chính - Ngân hàng', description: 'Ngân hàng, bảo hiểm, đầu tư, kế toán' }
    ];

    const { error: businessError } = await supabase
      .from('business_fields')
      .upsert(businessFields, { onConflict: 'code' });

    if (businessError) {
      console.log('⚠️ Business fields seeding error:', businessError.message);
    } else {
      console.log('✅ Business fields seeded successfully');
    }

    // Seed company descriptions
    console.log('🏢 Seeding company descriptions...');
    const companyDescriptions = [
      { code: 'cong-nghe-thong-tin', name: 'Công nghệ thông tin', description: 'Phát triển phần mềm, ứng dụng, website' },
      { code: 'marketing-quang-cao', name: 'Marketing & Quảng cáo', description: 'Dịch vụ marketing, quảng cáo truyền thông' },
      { code: 'tai-chinh-ngan-hang', name: 'Tài chính - Ngân hàng', description: 'Dịch vụ tài chính, ngân hàng, đầu tư' },
      { code: 'khoi-nghiep-startup', name: 'Khởi nghiệp - Startup', description: 'Công ty khởi nghiệp, đổi mới sáng tạo' }
    ];

    const { error: companyDescError } = await supabase
      .from('company_descriptions')
      .upsert(companyDescriptions, { onConflict: 'code' });

    if (companyDescError) {
      console.log('⚠️ Company descriptions seeding error:', companyDescError.message);
    } else {
      console.log('✅ Company descriptions seeded successfully');
    }

    console.log('🎉 Data seeding completed!');

  } catch (error) {
    console.log('❌ Seeding failed:', error.message);
    console.log('\n📋 Manual seeding required. Copy this SQL to Supabase SQL Editor:');
    showSeedSQL();
  }
}

function showSeedSQL() {
  console.log(`
-- Seed provinces
INSERT INTO provinces (code, name) VALUES
('hanoi', 'Hà Nội'),
('hcm', 'Hồ Chí Minh'),
('danang', 'Đà Nẵng'),
('haiphong', 'Hải Phòng'),
('cantho', 'Cần Thơ')
ON CONFLICT (code) DO NOTHING;

-- Seed districts
INSERT INTO districts (code, name, province_id) VALUES
('ba-dinh', 'Ba Đình', (SELECT id FROM provinces WHERE code = 'hanoi')),
('hoan-kiem', 'Hoàn Kiếm', (SELECT id FROM provinces WHERE code = 'hanoi')),
('dong-da', 'Đống Đa', (SELECT id FROM provinces WHERE code = 'hanoi')),
('cau-giay', 'Cầu Giấy', (SELECT id FROM provinces WHERE code = 'hanoi'))
ON CONFLICT (code) DO NOTHING;

-- Seed business fields
INSERT INTO business_fields (code, name, description) VALUES
('cong-nghe', 'Công nghệ thông tin', 'Lập trình, phát triển phần mềm, AI, blockchain'),
('tu-van', 'Tư vấn', 'Tư vấn kinh doanh, quản lý, chiến lược'),
('marketing', 'Marketing & Quảng cáo', 'Digital marketing, content, social media'),
('tai-chinh', 'Tài chính - Ngân hàng', 'Ngân hàng, bảo hiểm, đầu tư, kế toán')
ON CONFLICT (code) DO NOTHING;

-- Seed company descriptions
INSERT INTO company_descriptions (code, name, description) VALUES
('cong-nghe-thong-tin', 'Công nghệ thông tin', 'Phát triển phần mềm, ứng dụng, website'),
('marketing-quang-cao', 'Marketing & Quảng cáo', 'Dịch vụ marketing, quảng cáo truyền thông'),
('tai-chinh-ngan-hang', 'Tài chính - Ngân hàng', 'Dịch vụ tài chính, ngân hàng, đầu tư'),
('khoi-nghiep-startup', 'Khởi nghiệp - Startup', 'Công ty khởi nghiệp, đổi mới sáng tạo')
ON CONFLICT (code) DO NOTHING;
  `);
}

seedData();