const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedJobsAutomatic() {
    console.log('🚀 Starting Jobs Table Creation & Seeding...');

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
        return;
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 1. Run Migration Schema (06_create_jobs_table.sql)
        console.log('📄 Executing 06_create_jobs_table.sql...');
        const schemaSql = fs.readFileSync(path.join(__dirname, '06_create_jobs_table.sql'), 'utf8');

        // Split into individual statements if needed, but Supabase RPC exec supports blocks usually.
        // However, exec() functionality depends on if you enabled the psql extension or similar.
        // Standard Supabase JS client doesn't execute raw SQL easily without a Postgres Function.
        // Assuming 'exec' RPC exists from previous conversations (created in runMigration.js context presumably).
        // Let's check if we can run it.

        // We will use the 'exec' function if available, OR we try to run via REST if possible (not possible for DDL).
        // WORKAROUND: In previous turn, runMigration.js suggested using 'exec' RPC.
        // If 'exec' RPC is NOT created in your DB, this will fail.
        // Let's assume we need to create it or it exists.

        // First, let's try to see if we can use a simpler approach: Just create the tables if they don't exist via standard JS?
        // Doing DDL via JS client is not supported natively.
        // I will try to create the 'exec' function first just in case.

        /* 
           NOTE: Without direct SQL access, we rely on the user having run the "exec" function creation before.
           If not, this script might fail on DDL.
           But since I am an AI, I should try to be robust. 
           Let's try to run the file content using the exec RPC.
        */

        const { error: schemaError } = await supabase.rpc('exec', { sql: schemaSql });

        if (schemaError) {
            console.error('⚠️ Failed to run schema SQL via RPC. You might need to run it manually in SQL Editor.');
            console.error('Error:', schemaError.message);
            // Fallback: Check if tables exist by querying them? No point if creation failed.
        } else {
            console.log('✅ Schema created successfully.');
        }

        // 2. Run Seed Data (07_seed_draft_jobs.sql)
        // Same issue, inserting data via SQL script requires SQL execution.
        // But since this is INSERT, we can convert it to JS code like I did for seedDraftData.js!
        // This is safer and doesn't require RPC.

        console.log('🌱 Seeding Jobs Data via JS...');

        // Fetch dependencies
        const { data: companies } = await supabase.from('companies').select('id, name');
        const { data: businessFields } = await supabase.from('business_fields').select('id, code');
        const { data: jobTypes } = await supabase.from('job_types').select('id, code');
        const { data: provinces } = await supabase.from('provinces').select('id, code');

        if (!companies || companies.length === 0) {
            console.error('❌ No companies found. Please run seedDraftData.js first.');
            return;
        }

        const techComp = companies.find(c => c.name === 'TechViệt Solutions') || companies[0];
        const agencyComp = companies.find(c => c.name === 'Creative Agency Global') || companies[0];

        const itField = businessFields?.find(f => f.code === 'cong-nghe')?.id;
        const marketingField = businessFields?.find(f => f.code === 'marketing')?.id;

        const hanoi = provinces?.find(p => p.code === 'hanoi')?.id;
        const hcm = provinces?.find(p => p.code === 'hcm')?.id;

        // We need to fetch/create job types if they don't exist (since we skipped SQL execution potentially)
        // Actually, let's insert job types via JS just to be sure
        const jobTypesData = [
            { code: 'full-time', name: 'Toàn thời gian' },
            { code: 'part-time', name: 'Bán thời gian' },
            { code: 'remote', name: 'Remote' },
            { code: 'internship', name: 'Thực tập' }
        ];
        await supabase.from('job_types').upsert(jobTypesData, { onConflict: 'code' });

        // Refresh job types
        const { data: refreshedJobTypes } = await supabase.from('job_types').select('id, code');
        const fulltimeId = refreshedJobTypes?.find(t => t.code === 'full-time')?.id;
        const remoteId = refreshedJobTypes?.find(t => t.code === 'remote')?.id;

        // Data to insert
        const jobs = [
            {
                title: 'Senior ReactJS Developer (Lương tới $2000)',
                description: 'Tham gia phát triển các sản phẩm web application lớn cho khách hàng Nhật Bản.',
                requirements: '- Có ít nhất 3 năm kinh nghiệm với ReactJS\n- Có kiến thức về State Management',
                benefits: '- Lương thưởng hấp dẫn\n- Review lương 2 lần/năm',
                salary_from: 30000000,
                salary_to: 50000000,
                quantity: 2,
                role: 'Nhân viên',
                experience_required: '3 năm',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
                status: 'active',
                company_id: techComp.id,
                province_id: hanoi,
                views: 150,
                _business_field_id: itField,
                _job_type_id: fulltimeId
            },
            {
                title: 'Frontend Intern (Có lương)',
                description: 'Được đào tạo bài bản về quy trình làm việc Scrum/Agile.',
                requirements: '- Sinh viên năm cuối\n- Biết HTML/CSS/JS cơ bản',
                benefits: '- Trợ cấp thực tập: 3-5 triệu',
                salary_from: 3000000,
                salary_to: 5000000,
                quantity: 5,
                role: 'Thực tập sinh',
                experience_required: 'Không yêu cầu',
                deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                company_id: techComp.id,
                province_id: hanoi,
                views: 80,
                _business_field_id: itField,
                _job_type_id: fulltimeId
            },
            {
                title: 'Digital Marketing Manager',
                description: 'Xây dựng chiến lược marketing tổng thể.',
                requirements: '- 2 năm kinh nghiệm\n- Leader team',
                benefits: '- Môi trường năng động',
                salary_from: 20000000,
                salary_to: 30000000,
                quantity: 1,
                role: 'Trưởng phòng',
                experience_required: '2 năm',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                company_id: agencyComp.id,
                province_id: hcm,
                views: 200,
                _business_field_id: marketingField,
                _job_type_id: remoteId
            }
        ];

        for (const job of jobs) {
            // Remove helper keys
            const businessFieldId = job._business_field_id;
            const jobTypeId = job._job_type_id;
            delete job._business_field_id;
            delete job._job_type_id;

            // Insert Job
            const { data: createdJob, error } = await supabase
                .from('jobs')
                .insert(job)
                .select()
                .single();

            if (error) {
                console.error(`❌ Failed to create job ${job.title}:`, error.message);
            } else {
                console.log(`✅ Job created: ${job.title}`);

                // Insert Relations
                if (businessFieldId) {
                    await supabase.from('job_business_fields').insert({
                        job_id: createdJob.id,
                        business_field_id: businessFieldId
                    });
                }
                if (jobTypeId) {
                    await supabase.from('job_job_types').insert({
                        job_id: createdJob.id,
                        job_type_id: jobTypeId
                    });
                }
            }
        }

        console.log('🎉 Jobs seeding completed!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

seedJobsAutomatic();
