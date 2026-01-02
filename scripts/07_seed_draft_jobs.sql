-- ==============================================
-- DRAFT DATA FOR JOBS
-- ==============================================

DO $$
DECLARE
    -- IDs
    tech_company_id INTEGER;
    agency_company_id INTEGER;
    
    hanoi_id INTEGER;
    hcm_id INTEGER;
    
    it_field_id INTEGER;
    marketing_field_id INTEGER;
    
    fulltime_id INTEGER;
    remote_id INTEGER;
    
    job1_id INTEGER;
    job2_id INTEGER;
    job3_id INTEGER;
    
BEGIN
    -- 1. Lấy dữ liệu Reference
    SELECT id INTO tech_company_id FROM companies WHERE name = 'TechViệt Solutions' LIMIT 1;
    SELECT id INTO agency_company_id FROM companies WHERE name = 'Creative Agency Global' LIMIT 1;
    
    SELECT id INTO hanoi_id FROM provinces WHERE code = 'hanoi';
    SELECT id INTO hcm_id FROM provinces WHERE code = 'hcm';
    
    SELECT id INTO it_field_id FROM business_fields WHERE code = 'cong-nghe';
    SELECT id INTO marketing_field_id FROM business_fields WHERE code = 'marketing';
    
    SELECT id INTO fulltime_id FROM job_types WHERE code = 'full-time';
    SELECT id INTO remote_id FROM job_types WHERE code = 'remote';

    IF tech_company_id IS NULL OR agency_company_id IS NULL THEN
        RAISE NOTICE 'Chưa có công ty mẫu. Vui lòng chạy script 05_seed_draft_companies.sql trước.';
        RETURN;
    END IF;

    -- 2. Tạo Jobs mẫu
    
    -- TECH COMPANY JOBS
    INSERT INTO jobs (title, description, requirements, benefits, salary_from, salary_to, quantity, role, experience_required, deadline, status, company_id, province_id, created_at, views)
    VALUES 
    (
        'Senior ReactJS Developer (Lương tới $2000)',
        'Tham gia phát triển các sản phẩm web application lớn cho khách hàng Nhật Bản. Sử dụng ReactJS, NextJS, TailwindCSS.',
        '- Có ít nhất 3 năm kinh nghiệm với ReactJS
- Có kiến thức về State Management (Redux, Zustand)
- Tiếng Anh đọc hiểu tài liệu',
        '- Lương thưởng hấp dẫn
- Review lương 2 lần/năm
- Đóng bảo hiểm full lương',
        30000000, 50000000,
        2, 'Nhân viên', '3 năm',
        NOW() + INTERVAL '30 days',
        'active',
        tech_company_id,
        hanoi_id,
        NOW(),
        150
    ) RETURNING id INTO job1_id;
    
    -- Map Business Field & Job Type
    INSERT INTO job_business_fields (job_id, business_field_id) VALUES (job1_id, it_field_id);
    INSERT INTO job_job_types (job_id, job_type_id) VALUES (job1_id, fulltime_id);
    
    
    INSERT INTO jobs (title, description, requirements, benefits, salary_from, salary_to, quantity, role, experience_required, deadline, status, company_id, province_id, created_at, views)
    VALUES 
    (
        'Frontend Intern (Có lương)',
        'Được đào tạo bài bản về quy trình làm việc Scrum/Agile. Tham gia dự án thực tế.',
        '- Sinh viên năm cuối hoặc mới ra trường
- Có tư duy lập trình tốt
- Biết HTML/CSS/JS cơ bản',
        '- Trợ cấp thực tập: 3-5 triệu
- Cơ hội trở thành nhân viên chính thức',
        3000000, 5000000,
        5, 'Thực tập sinh', 'Không yêu cầu',
        NOW() + INTERVAL '15 days',
        'active',
        tech_company_id,
        hanoi_id,
        NOW() - INTERVAL '2 days',
        80
    ) RETURNING id INTO job2_id;
    
    INSERT INTO job_business_fields (job_id, business_field_id) VALUES (job2_id, it_field_id);
    INSERT INTO job_job_types (job_id, job_type_id) VALUES (job2_id, fulltime_id); -- internship nếu có


    -- AGENCY COMPANY JOBS
    INSERT INTO jobs (title, description, requirements, benefits, salary_from, salary_to, quantity, role, experience_required, deadline, status, company_id, province_id, created_at, views)
    VALUES 
    (
        'Digital Marketing Manager',
        'Xây dựng chiến lược marketing tổng thể cho các nhãn hàng F&B.',
        '- 2 năm kinh nghiệm ở vị trí tương đương
- Có khả năng leader team
- Sáng tạo, chịu được áp lực',
        '- Môi trường 9x năng động
- Teambuilding 3 tháng/lần',
        20000000, 30000000,
        1, 'Trưởng phòng', '2 năm',
        NOW() + INTERVAL '45 days',
        'active',
        agency_company_id,
        hcm_id,
        NOW() - INTERVAL '1 day',
        200
    ) RETURNING id INTO job3_id;
    
    INSERT INTO job_business_fields (job_id, business_field_id) VALUES (job3_id, marketing_field_id);
    INSERT INTO job_job_types (job_id, job_type_id) VALUES (job3_id, remote_id);

    RAISE NOTICE 'Đã tạo xong 3 jobs mẫu';

END $$;
