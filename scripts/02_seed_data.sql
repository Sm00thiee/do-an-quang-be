-- ==============================================
-- SEED DATA FOR RECRUITMENT WEB
-- ==============================================

-- 1. INSERT PROVINCES
INSERT INTO provinces (code, name) VALUES
('hanoi', 'Hà Nội'),
('hcm', 'Hồ Chí Minh'),
('danang', 'Đà Nẵng'),
('haiphong', 'Hải Phòng'),
('cantho', 'Cần Thơ'),
('binhduong', 'Bình Dương'),
('dongnai', 'Đồng Nai'),
('khanhhoa', 'Khánh Hòa'),
('lam dong', 'Lâm Đồng'),
('quangninh', 'Quảng Ninh')
ON CONFLICT (code) DO NOTHING;

-- 2. INSERT DISTRICTS FOR HANOI
INSERT INTO districts (code, name, province_id) VALUES
('ba-dinh', 'Ba Đình', (SELECT id FROM provinces WHERE code = 'hanoi')),
('hoan-kiem', 'Hoàn Kiếm', (SELECT id FROM provinces WHERE code = 'hanoi')),
('dong-da', 'Đống Đa', (SELECT id FROM provinces WHERE code = 'hanoi')),
('hai-ba-trung', 'Hai Bà Trưng', (SELECT id FROM provinces WHERE code = 'hanoi')),
('cau-giay', 'Cầu Giấy', (SELECT id FROM provinces WHERE code = 'hanoi')),
('thanh-xuan', 'Thanh Xuân', (SELECT id FROM provinces WHERE code = 'hanoi')),
('hoang-mai', 'Hoàng Mai', (SELECT id FROM provinces WHERE code = 'hanoi')),
('long-bien', 'Long Biên', (SELECT id FROM provinces WHERE code = 'hanoi')),
('nam-tu-liem', 'Nam Từ Liêm', (SELECT id FROM provinces WHERE code = 'hanoi')),
('bac-tu-liem', 'Bắc Từ Liêm', (SELECT id FROM provinces WHERE code = 'hanoi'))
ON CONFLICT (code) DO NOTHING;

-- 3. INSERT DISTRICTS FOR HCM
INSERT INTO districts (code, name, province_id) VALUES
('quan-1', 'Quận 1', (SELECT id FROM provinces WHERE code = 'hcm')),
('quan-3', 'Quận 3', (SELECT id FROM provinces WHERE code = 'hcm')),
('quan-5', 'Quận 5', (SELECT id FROM provinces WHERE code = 'hcm')),
('quan-7', 'Quận 7', (SELECT id FROM provinces WHERE code = 'hcm')),
('phu-nhuan', 'Phú Nhuận', (SELECT id FROM provinces WHERE code = 'hcm')),
('binh-thanh', 'Bình Thạnh', (SELECT id FROM provinces WHERE code = 'hcm')),
('go-vap', 'Gò Vấp', (SELECT id FROM provinces WHERE code = 'hcm')),
('thu-duc', 'Thủ Đức', (SELECT id FROM provinces WHERE code = 'hcm'))
ON CONFLICT (code) DO NOTHING;

-- 4. INSERT BUSINESS FIELDS
INSERT INTO business_fields (code, name, description) VALUES
('cong-nghe', 'Công nghệ thông tin', 'Lập trình, phát triển phần mềm, AI, blockchain'),
('tu-van', 'Tư vấn', 'Tư vấn kinh doanh, quản lý, chiến lược'),
('marketing', 'Marketing & Quảng cáo', 'Digital marketing, content, social media'),
('tai-chinh', 'Tài chính - Ngân hàng', 'Ngân hàng, bảo hiểm, đầu tư, kế toán'),
('y-te', 'Y tế - Sức khỏe', 'Bệnh viện, phòng khám, dược phẩm'),
('giao-duc', 'Giáo dục - Đào tạo', 'Trường học, trung tâm đào tạo, e-learning'),
('ban-le', 'Bán lẻ - Thương mại', 'Siêu thị, cửa hàng, thương mại điện tử'),
('du-lich', 'Du lịch - Khách sạn', 'Tour du lịch, khách sạn, nhà hàng'),
('xay-dung', 'Xây dựng - Kiến trúc', 'Xây dựng dân dụng, công nghiệp, thiết kế'),
('logistics', 'Vận tải - Logistics', 'Vận chuyển, kho bãi, giao hàng'),
('nang-luong', 'Năng lượng', 'Điện, gas, năng lượng tái tạo'),
('san-xuat', 'Sản xuất - Chế tạo', 'Nhà máy, sản xuất công nghiệp')
ON CONFLICT (code) DO NOTHING;

-- 5. INSERT COMPANY DESCRIPTIONS  
INSERT INTO company_descriptions (code, name, description) VALUES
('cong-nghe-thong-tin', 'Công nghệ thông tin', 'Phát triển phần mềm, ứng dụng, website'),
('marketing-quang-cao', 'Marketing & Quảng cáo', 'Dịch vụ marketing, quảng cáo truyền thông'),
('tai-chinh-ngan-hang', 'Tài chính - Ngân hàng', 'Dịch vụ tài chính, ngân hàng, đầu tư'),
('y-te-cham-soc-suc-khoe', 'Y tế - Chăm sóc sức khỏe', 'Dịch vụ y tế, chăm sóc sức khỏe'),
('giao-duc-dao-tao', 'Giáo dục - Đào tạo', 'Giáo dục, đào tạo, phát triển kỹ năng'),
('thuong-mai-dien-tu', 'Thương mại điện tử', 'Bán hàng online, marketplace, dropshipping'),
('dich-vu-tu-van', 'Dịch vụ tư vấn', 'Tư vấn kinh doanh, quản lý, phát triển'),
('du-lich-dich-vu', 'Du lịch - Dịch vụ', 'Tour du lịch, booking, dịch vụ lưu trú'),
('bat-dong-san', 'Bất động sản', 'Mua bán, cho thuê, đầu tư BDS'),
('logistics-van-chuyen', 'Logistics - Vận chuyển', 'Dịch vụ vận chuyển, giao hàng'),
('khoi-nghiep-startup', 'Khởi nghiệp - Startup', 'Công ty khởi nghiệp, đổi mới sáng tạo'),
('phi-loi-nhuan', 'Phi lợi nhuận', 'Tổ chức xã hội, từ thiện, NGO')
ON CONFLICT (code) DO NOTHING;