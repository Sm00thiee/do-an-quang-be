const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { candidateOnly, employerOnly } = require('../middleware/guestProtection');
const router = express.Router();

/**
 * POST /api/applications/apply
 * @desc Candidate applies for a job
 */
router.post('/apply', authenticateToken, candidateOnly, async (req, res) => {
    try {
        const { jobId, cvUrl, coverLetter } = req.body;
        const candidateId = req.user.id;

        // Validate input
        if (!jobId || !cvUrl) {
            return res.status(400).json({ error: 'Job ID and CV URL are required' });
        }

        // Check if job exists and is active
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, title, status')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'active') {
            return res.status(400).json({ error: 'This job is no longer accepting applications' });
        }

        // Check if already applied
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', jobId)
            .eq('candidate_id', candidateId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'You have already applied to this job' });
        }

        // Create application
        const { data: application, error } = await supabase
            .from('applications')
            .insert({
                job_id: jobId,
                candidate_id: candidateId,
                cv_url: cvUrl,
                cover_letter: coverLetter,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/applications/my-applications
 * @desc Get candidate's own applications
 */
router.get('/my-applications', authenticateToken, candidateOnly, async (req, res) => {
    try {
        const { page = 0, limit = 10, status } = req.query;
        const offset = page * limit;

        let query = supabase
            .from('applications')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    salary_from,
                    salary_to,
                    deadline,
                    companies (
                        id,
                        name,
                        logo_url
                    ),
                    provinces (name)
                )
            `, { count: 'exact' })
            .eq('candidate_id', req.user.id)
            .order('applied_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        res.json({
            applications: data,
            totalPages: Math.ceil(count / limit),
            totalCount: count,
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/applications/job/:jobId
 * @desc Employer gets applications for their job
 */
router.get('/job/:jobId', authenticateToken, employerOnly, async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status } = req.query;

        // Verify employer owns this job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, company_id, companies!inner(owner_id)')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.companies.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to view these applications' });
        }

        // Get applications
        let query = supabase
            .from('applications')
            .select(`
                *,
                user_profiles!applications_candidate_id_fkey (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    avatar_url
                )
            `)
            .eq('job_id', jobId)
            .order('applied_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ applications: data });
    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/applications/:id/review
 * @desc Employer reviews an application
 */
router.put('/:id/review', authenticateToken, employerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'rejected', 'interviewed', 'hired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Get application to verify ownership
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select(`
                id,
                job_id,
                jobs!inner(
                    company_id,
                    companies!inner(owner_id)
                )
            `)
            .eq('id', id)
            .single();

        if (appError || !application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.jobs.companies.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to review this application' });
        }

        // Update application
        const { data: updated, error } = await supabase
            .from('applications')
            .update({
                status,
                notes,
                reviewed_by: req.user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Application reviewed successfully',
            application: updated
        });
    } catch (error) {
        console.error('Error reviewing application:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/applications/:id
 * @desc Candidate withdraws their application
 */
router.delete('/:id', authenticateToken, candidateOnly, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const { data: application } = await supabase
            .from('applications')
            .select('candidate_id')
            .eq('id', id)
            .single();

        if (!application || application.candidate_id !== req.user.id) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Delete
        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
