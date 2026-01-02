const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/jobs
 * @desc Get list of jobs with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 12; // Adjusted to match typical grid layout
        const offset = page * limit;

        const { keyword, province_id, business_field_id, job_type_id, salary_from, salary_to } = req.query;

        // Start building query
        let query = supabase
            .from('jobs')
            .select(`
        *,
        companies (id, name, logo_url),
        provinces (id, name),
        districts (id, name),
        job_business_fields (
            business_fields (id, name)
        ),
        job_job_types (
            job_types (id, name)
        )
      `, { count: 'exact' })
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (keyword) {
            query = query.ilike('title', `%${keyword}%`);
        }

        if (province_id) {
            query = query.eq('province_id', province_id);
        }

        // Filtering by related tables (business_fields, job_types) in Supabase is tricky with direct standard syntax.
        // Standard approach: use !inner join to filter parents based on children.

        if (business_field_id) {
            // This requires the relationship to be set (which it is).
            // Syntax: job_business_fields!inner(business_field_id)
            query = supabase
                .from('jobs')
                .select(`
            *,
            companies (id, name, logo_url),
            provinces (id, name),
            districts (id, name),
            job_business_fields!inner (
                business_fields (id, name)
            ),
            job_job_types (
                job_types (id, name)
            )
        `, { count: 'exact' })
                .eq('status', 'active')
                .eq('job_business_fields.business_field_id', business_field_id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
        }

        if (salary_from) {
            query = query.gte('salary_from', salary_from);
        }

        // Execute query
        const { data, count, error } = await query;

        if (error) throw error;

        res.json({
            content: data, // Matching the response structure expected by frontend (usually Spring Boot style 'content') or just array
            totalPages: Math.ceil(count / limit),
            totalElements: count,
            last: (offset + limit) >= count,
            size: limit,
            number: page
        });

    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/jobs/getHotList
 * @desc Get hot/featured jobs (high salary or views)
 */
router.get('/getHotList', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                companies (id, name, logo_url, size),
                provinces (id, name)
            `)
            .eq('status', 'active')
            .order('views', { ascending: false }) // Most viewed as hot
            .limit(6);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error hot jobs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/jobs/:id/getByID
 * @desc Get job detail
 */
router.get('/:id/getByID', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                companies (
                    *,
                    provinces(name),
                    districts(name)
                ),
                provinces (id, name),
                districts (id, name),
                job_business_fields (
                    business_fields (id, name)
                ),
                job_job_types (
                    job_types (id, name)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Increment query (fire and forget)
        supabase.rpc('increment_job_view', { job_id: id }); // Need to create RPC function ideally, or update manually

        res.json(data);
    } catch (error) {
        console.error('Error job detail:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
