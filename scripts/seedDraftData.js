const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function seedDraftData() {
    console.log('🚀 Starting draft data seeding...');

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
        return;
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Get a user to own the data
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError || !users || users.length === 0) {
            console.error('❌ No users found in database. Please register a user first.');
            return;
        }

        const targetUserId = users[0].id; // Use the first user found
        console.log(`👤 Using user ID: ${targetUserId} (${users[0].email})`);

        // CHECK IF PROFILE EXISTS
        const { data: userProfile } = await supabase.from('user_profiles').select('id').eq('id', targetUserId).single();
        if (!userProfile) {
            console.log('⚠️ User profile missing. Creating dummy profile...');
            const { error: profileError } = await supabase.from('user_profiles').insert({
                id: targetUserId,
                email: users[0].email,
                first_name: 'Admin',
                last_name: 'Official',
                role: 'employer' // Must be employer to own companies
            });
            if (profileError) {
                console.error('❌ Failed to create profile:', profileError.message);
                return;
            }
            console.log('✅ Created user profile.');
        } else {
            // Ensure role is employer
            await supabase.from('user_profiles').update({ role: 'employer' }).eq('id', targetUserId);
        }

        // =========================================================================
        // SEED COMPANIES
        // =========================================================================
        console.log('🏢 Seeding fake companies...');

        // Get location IDs
        const { data: hanoi } = await supabase.from('provinces').select('id').eq('code', 'hanoi').single();
        const { data: hcm } = await supabase.from('provinces').select('id').eq('code', 'hcm').single();
        const { data: badinh } = await supabase.from('districts').select('id').eq('code', 'ba-dinh').single();
        const { data: quan1 } = await supabase.from('districts').select('id').eq('code', 'quan-1').single();

        if (hanoi && hcm && badinh && quan1) {
            const companies = [
                {
                    name: 'TechViệt Solutions',
                    description: 'Công ty hàng đầu về giải pháp phần mềm và chuyển đổi số tại Việt Nam. Môi trường trẻ trung, năng động.',
                    size: '51-200',
                    address: 'Tòa nhà Lancaster, 20 Núi Trúc',
                    province_id: hanoi.id,
                    district_id: badinh.id,
                    website: 'https://techviet.example.com',
                    logo_url: 'https://ui-avatars.com/api/?name=TV&background=0D8ABC&color=fff&size=256',
                    owner_id: targetUserId
                },
                {
                    name: 'Creative Agency Global',
                    description: 'Agency chuyên về Branding và Digital Marketing cho các nhãn hàng quốc tế.',
                    size: '11-50',
                    address: 'Bitexco Financial Tower',
                    province_id: hcm.id,
                    district_id: quan1.id,
                    website: 'https://creative.example.com',
                    logo_url: 'https://ui-avatars.com/api/?name=CA&background=ff5722&color=fff&size=256',
                    owner_id: targetUserId
                }
            ];

            for (const company of companies) {
                // Check if company exists to avoid duplicates (weak check by name)
                const { data: existing } = await supabase.from('companies').select('id').eq('name', company.name).single();
                if (!existing) {
                    const { error } = await supabase.from('companies').insert(company);
                    if (error) console.error(`Failed to insert company ${company.name}:`, error.message);
                    else console.log(`✅ Created company: ${company.name}`);
                } else {
                    console.log(`ℹ️ Company ${company.name} already exists.`);
                }
            }
        } else {
            console.log('⚠️ Could not find provinces/districts. Skipping company seeding.');
        }

        // =========================================================================
        // SEED ROADMAPS
        // =========================================================================
        console.log('🗺️ Seeding roadmaps...');

        const roadmapData = {
            title: 'Digital Marketing Specialist',
            description: 'Lộ trình trở thành chuyên gia Digital Marketing chuyên nghiệp từ con số 0.',
            category: 'Marketing',
            status: 'active',
            progress: 0,
            is_public: true,
            total_sections: 3,
            user_id: targetUserId
        };

        // Check if roadmap exists
        const { data: existingRoadmap } = await supabase.from('roadmaps').select('id').eq('title', roadmapData.title).eq('user_id', targetUserId).single();

        if (!existingRoadmap) {
            // 1. Create Roadmap
            const { data: roadmap, error: rError } = await supabase.from('roadmaps').insert(roadmapData).select().single();

            if (rError) {
                console.error('Failed to create roadmap:', rError.message);
            } else {
                console.log(`✅ Created roadmap: ${roadmap.title}`);

                // 2. Create Sections
                const sections = [
                    { roadmap_id: roadmap.id, title: 'Khởi động với Marketing', description: 'Nắm vững các khái niệm cơ bản', order_index: 1, color: '#FF5733', icon: '🚀' },
                    { roadmap_id: roadmap.id, title: 'Content Marketing', description: 'Nghệ thuật viết content', order_index: 2, color: '#33C1FF', icon: '✍️' },
                    { roadmap_id: roadmap.id, title: 'Social Media & Ads', description: 'Quảng cáo đa nền tảng', order_index: 3, color: '#FFC300', icon: '📢' }
                ];

                const { data: createdSections, error: sError } = await supabase.from('roadmap_sections').insert(sections).select();

                if (sError) console.error('Failed sections:', sError.message);
                else {
                    // 3. Create Lessons for Section 1
                    const section1 = createdSections.find(s => s.order_index === 1);
                    if (section1) {
                        const lessons = [
                            { section_id: section1.id, title: 'Marketing căn bản là gì?', description: 'Concept 4P', duration_minutes: 45, order_index: 1 },
                            { section_id: section1.id, title: 'Phân tích thị trường', description: 'Research & Analysis', duration_minutes: 60, order_index: 2 }
                        ];

                        const { data: createdLessons, error: lError } = await supabase.from('roadmap_lessons').insert(lessons).select();

                        if (lError) console.error('Failed lessons:', lError.message);
                        else {
                            // 4. Create Skills & Resources for Lesson 1
                            const lesson1 = createdLessons.find(l => l.order_index === 1);
                            if (lesson1) {
                                await supabase.from('roadmap_skills').insert([
                                    { lesson_id: lesson1.id, name: 'Marketing Mix (4P)', description: 'Product, Price, Place, Promotion' },
                                    { lesson_id: lesson1.id, name: 'Customer Centric', description: 'Tư duy khách hàng' }
                                ]);

                                await supabase.from('roadmap_resources').insert([
                                    { lesson_id: lesson1.id, title: 'Video: Marketing 101', url: 'https://youtube.com', type: 'video' },
                                    { lesson_id: lesson1.id, title: 'Sách: Marketing căn bản', url: 'https://tiki.vn', type: 'book' }
                                ]);
                            }
                        }
                    }
                }
            }
        } else {
            console.log(`ℹ️ Roadmap "${roadmapData.title}" already exists.`);
        }

        // Seed Second Roadmap (Frontend)
        const frontendRoadmapData = {
            title: 'Frontend Developer Professional',
            description: 'Trở thành lập trình viên Frontend với ReactJS.',
            category: 'IT',
            status: 'active',
            progress: 0,
            is_public: true,
            total_sections: 3,
            user_id: targetUserId
        };

        const { data: existingFrontend } = await supabase.from('roadmaps').select('id').eq('title', frontendRoadmapData.title).eq('user_id', targetUserId).single();

        if (!existingFrontend) {
            const { data: roadmap, error: rError } = await supabase.from('roadmaps').insert(frontendRoadmapData).select().single();
            if (!rError) {
                console.log(`✅ Created roadmap: ${roadmap.title}`);
                // Sections for Frontend
                await supabase.from('roadmap_sections').insert([
                    { roadmap_id: roadmap.id, title: 'HTML & CSS', order_index: 1, color: '#E44D26', icon: '💻' },
                    { roadmap_id: roadmap.id, title: 'JavaScript', order_index: 2, color: '#F7DF1E', icon: '⚡' },
                    { roadmap_id: roadmap.id, title: 'ReactJS', order_index: 3, color: '#61DAFB', icon: '⚛️' }
                ]);
            }
        } else {
            console.log(`ℹ️ Roadmap "${frontendRoadmapData.title}" already exists.`);
        }

        console.log('🎉 Draft data seeding completed!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

seedDraftData();
