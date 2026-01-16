-- ==============================================
-- DRAFT DATA FOR RECRUITMENT WEB - ROADMAPS
-- ==============================================

-- Chiến lược: Lấy ID của user đầu tiên tìm thấy trong bảng auth.users để làm chủ sở hữu.
-- Nếu chưa có user nào, script này sẽ không thêm gì cả (hoặc lỗi).
-- Hãy đảm bảo bạn đã Đăng ký ít nhất 1 tài khoản trên website trước khi chạy.

DO $$
DECLARE
    target_user_id UUID;
    roadmap_id UUID;
    section1_id UUID;
    section2_id UUID;
    section3_id UUID;
    lesson1_id UUID;
    lesson2_id UUID;
    section_html_id UUID;
    section_js_id UUID;
    section_react_id UUID;
    lesson_html_id UUID;
BEGIN
    -- Lấy user ID đầu tiên
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Chưa có user nào trong auth.users. Vui lòng đăng ký tài khoản trước.';
        RETURN;
    END IF;

    RAISE NOTICE 'Đang tạo dữ liệu mẫu cho User ID: %', target_user_id;

    -- ====================================================
    -- ROADMAP SỐ 1: DIGITAL MARKETING
    -- ====================================================
    INSERT INTO roadmaps (user_id, title, description, category, status, progress, is_public, total_sections, completed_sections)
    VALUES 
    (
        target_user_id,
        'Digital Marketing Specialist', 
        'Lộ trình trở thành chuyên gia Digital Marketing chuyên nghiệp từ con số 0.',
        'Marketing',
        'active',
        0,
        true,
        3,
        0
    )
    RETURNING id INTO roadmap_id;

    -- SECTION 1
    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'Khởi động với Marketing', 'Nắm vững các khái niệm cơ bản về Marketing', 1, '#FF5733', '🚀')
    RETURNING id INTO section1_id;

    -- SECTION 2
    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'Content Marketing', 'Nghệ thuật viết và sáng tạo nội dung', 2, '#33C1FF', '✍️')
    RETURNING id INTO section2_id;

    -- SECTION 3
    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'Social Media & Ads', 'Chạy quảng cáo và quản lý mạng xã hội', 3, '#FFC300', '📢')
    RETURNING id INTO section3_id;

    -- LESSONS FOR SECTION 1
    INSERT INTO roadmap_lessons (section_id, title, description, duration_minutes, order_index)
    VALUES (section1_id, 'Marketing căn bản là gì?', 'Hiểu về 4P trong Marketing', 45, 1)
    RETURNING id INTO lesson1_id;

    INSERT INTO roadmap_lessons (section_id, title, description, duration_minutes, order_index)
    VALUES (section1_id, 'Phân tích thị trường', 'Cách nghiên cứu đối thủ và khách hàng', 60, 2)
    RETURNING id INTO lesson2_id;

    -- SKILLS & RESOURCES
    INSERT INTO roadmap_skills (lesson_id, name, description)
    VALUES 
    (lesson1_id, 'Marketing Mix (4P)', 'Hiểu Product, Price, Place, Promotion'),
    (lesson1_id, 'Tư duy khách hàng', 'Customer Centric Mindset');

    INSERT INTO roadmap_resources (lesson_id, title, url, type)
    VALUES 
    (lesson1_id, 'Video: Marketing 101', 'https://youtube.com', 'video'),
    (lesson1_id, 'Sách: Marketing căn bản', 'https://tiki.vn', 'book');

    -- ====================================================
    -- ROADMAP SỐ 2: FRONTEND DEVELOPER
    -- ====================================================
    INSERT INTO roadmaps (user_id, title, description, category, status, progress, is_public, total_sections, completed_sections)
    VALUES 
    (
        target_user_id,
        'Frontend Developer Professional', 
        'Trở thành lập trình viên Frontend với ReactJS, NextJS và Modern UI/UX.',
        'IT',
        'active',
        0,
        true,
        3,
        0
    )
    RETURNING id INTO roadmap_id;

    -- SECTIONS
    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'HTML & CSS Căn bản', 'Xây dựng giao diện web cơ bản', 1, '#E44D26', '💻')
    RETURNING id INTO section_html_id;

    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'JavaScript Nâng cao', 'Làm chủ ngôn ngữ lập trình web', 2, '#F7DF1E', '⚡')
    RETURNING id INTO section_js_id;

    INSERT INTO roadmap_sections (roadmap_id, title, description, order_index, color, icon)
    VALUES (roadmap_id, 'ReactJS & Ecosystem', 'Xây dựng ứng dụng Single Page App', 3, '#61DAFB', '⚛️')
    RETURNING id INTO section_react_id;

    -- LESSONS
    INSERT INTO roadmap_lessons (section_id, title, description, duration_minutes, order_index)
    VALUES (section_html_id, 'Cấu trúc trang HTML5', 'Semantic HTML và các thẻ quan trọng', 30, 1)
    RETURNING id INTO lesson_html_id;

    -- SKILLS & RESOURCES
    INSERT INTO roadmap_skills (lesson_id, name, description)
    VALUES (lesson_html_id, 'Semantic HTML', 'Sử dụng thẻ đúng ý nghĩa');

    INSERT INTO roadmap_resources (lesson_id, title, url, type)
    VALUES (lesson_html_id, 'MDN Web Docs', 'https://developer.mozilla.org', 'article');

END $$;
