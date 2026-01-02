-- ==============================================
-- DRAFT DATA FOR RECRUITMENT WEB - COMPANIES
-- ==============================================

DO $$
DECLARE
    target_user_id UUID;
    hanoi_id INTEGER;
    hcm_id INTEGER;
    badinh_id INTEGER;
    quan1_id INTEGER;
BEGIN
    -- 1. Lấy user ID làm chủ sở hữu (Yêu cầu user này Role phải là Employer - nhưng ở đây ta cứ lấy đại để test)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Chưa có user nào. Vui lòng đăng ký trước.';
        RETURN;
    END IF;

    -- 2. Lấy ID địa điểm
    SELECT id INTO hanoi_id FROM provinces WHERE code = 'hanoi';
    SELECT id INTO hcm_id FROM provinces WHERE code = 'hcm';
    SELECT id INTO badinh_id FROM districts WHERE code = 'ba-dinh';
    SELECT id INTO quan1_id FROM districts WHERE code = 'quan-1';

    -- 3. Tạo Công ty giả lập
    
    -- Công ty 1 logic
    INSERT INTO companies (name, description, size, address, province_id, district_id, website, logo_url, owner_id)
    VALUES 
    (
        'TechViệt Solutions', 
        'Công ty hàng đầu về giải pháp phần mềm và chuyển đổi số tại Việt Nam. Môi trường trẻ trung, năng động.',
        '51-200',
        'Tòa nhà Lancaster, 20 Núi Trúc',
        hanoi_id,
        badinh_id,
        'https://techviet.example.com',
        'https://ui-avatars.com/api/?name=TV&background=0D8ABC&color=fff&size=256',
        target_user_id
    );

    -- Công ty 2 logic
    INSERT INTO companies (name, description, size, address, province_id, district_id, website, logo_url, owner_id)
    VALUES 
    (
        'Creative Agency Global', 
        'Agency chuyên về Branding và Digital Marketing cho các nhãn hàng quốc tế.',
        '11-50',
        'Bitexco Financial Tower',
        hcm_id,
        quan1_id,
        'https://creative.example.com',
        'https://ui-avatars.com/api/?name=CA&background=ff5722&color=fff&size=256',
        target_user_id
    );

    RAISE NOTICE 'Đã tạo xong 2 công ty mẫu cho User %', target_user_id;

END $$;
