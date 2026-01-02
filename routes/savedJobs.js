const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { guestProtection } = require('../middleware/guestProtection');
const router = express.Router();

/**
 * POST /api/saved-jobs
 * @desc Save a job for later
 */
router.post('/', authenticateToken, guestProtection, async (req, res) => {
    try {
        const { jobId } = req.body;
        const userId = req.user.id;

        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        // Check if job exists
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if already saved
        const { data: existing } = await supabase
            .from('saved_jobs')
            .select('id')
            .eq('user_id', userId)
            .eq('job_id', jobId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Job already saved' });
        }

        // Save job
        const { data, error } = await supabase
            .from('saved_jobs')
            .insert({ user_id: userId, job_id: jobId })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Job saved successfully',
            savedJob: data
        });
    } catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/saved-jobs
 * @desc Get user's saved jobs
 */
router.get('/', authenticateToken, guestProtection, async (req, res) => {
    try {
        const { page = 0, limit = 12 } = req.query;
        const offset = page * limit;

        const { data, count, error } = await supabase
            .from('saved_jobs')
            .select(`
                id,
                created_at,
                jobs (
                    *,
                    companies (id, name, logo_url),
                    provinces (name),
                    job_business_fields (
                        business_fields (name)
                    )
                )
            `, { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            savedJobs: data,
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/saved-jobs/:id
 * @desc Remove a saved job
 */
router.delete('/:id', authenticateToken, guestProtection, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: savedJob } = await supabase
            .from('saved_jobs')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!savedJob || savedJob.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Saved job not found' });
        }

        // Delete
        const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Job removed from saved list' });
    } catch (error) {
        console.error('Error removing saved job:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/saved-jobs/by-job/:jobId
 * @desc Remove a saved job by job ID (for UI convenience)
 */
router.delete('/by-job/:jobId', authenticateToken, guestProtection, async (req, res) => {
    try {
        const { jobId } = req.params;

        const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('user_id', req.user.id)
            .eq('job_id', jobId);

        if (error) throw error;

        res.json({ message: 'Job removed from saved list' });
    } catch (error) {
        console.error('Error removing saved job:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/saved-jobs/check/:jobId
 * @desc Check if a job is saved
 */
router.get('/check/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!req.user) {
            return res.json({ isSaved: false });
        }

        const { data } = await supabase
            .from('saved_jobs')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('job_id', jobId)
            .single();

        res.json({ isSaved: !!data });
    } catch (error) {
        res.json({ isSaved: false });
    }
});

module.exports = router;
