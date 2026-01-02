const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { candidateOnly } = require('../middleware/guestProtection');
const router = express.Router();

/**
 * POST /api/ai/generate-roadmap
 * @desc Generate AI career roadmap based on user input
 */
router.post('/generate-roadmap', authenticateToken, candidateOnly, async (req, res) => {
    try {
        const { careerGoal, currentLevel, targetRole, industry, timeframe } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!careerGoal || !targetRole) {
            return res.status(400).json({
                error: 'Career goal and target role are required'
            });
        }

        // Get user profile and preferences for context
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*, user_business_fields(business_fields(name))')
            .eq('id', userId)
            .single();

        const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Prepare AI context
        const aiContext = {
            user: {
                name: `${userProfile?.first_name} ${userProfile?.last_name}`,
                currentFields: userProfile?.user_business_fields?.map(f => f.business_fields.name) || [],
                salaryExpectation: preferences?.salary_expectation_from || null
            },
            input: {
                careerGoal,
                currentLevel: currentLevel || 'beginner',
                targetRole,
                industry: industry || 'Technology',
                timeframe: timeframe || '6 months'
            }
        };

        // Call AI service (Gemini API or your AI integration)
        const aiRoadmap = await generateRoadmapWithAI(aiContext);

        // Create roadmap in database
        const { data: roadmap, error: roadmapError } = await supabase
            .from('roadmaps')
            .insert({
                user_id: userId,
                title: aiRoadmap.title || `Lộ trình ${targetRole}`,
                description: aiRoadmap.description,
                category: industry.toLowerCase(),
                status: 'active'
            })
            .select()
            .single();

        if (roadmapError) throw roadmapError;

        // Create sections and lessons
        for (const [index, section] of aiRoadmap.sections.entries()) {
            const { data: sectionData } = await supabase
                .from('roadmap_sections')
                .insert({
                    roadmap_id: roadmap.id,
                    title: section.title,
                    description: section.description,
                    order_index: index,
                    color: section.color || '#0066FF'
                })
                .select()
                .single();

            // Create lessons for this section
            for (const [lessonIndex, lesson] of section.lessons.entries()) {
                await supabase
                    .from('roadmap_lessons')
                    .insert({
                        section_id: sectionData.id,
                        title: lesson.title,
                        description: lesson.description,
                        content: lesson.content || {},
                        order_index: lessonIndex,
                        duration_minutes: lesson.duration || 60
                    });
            }
        }

        res.status(201).json({
            message: 'Roadmap generated successfully',
            roadmap: {
                ...roadmap,
                sections: aiRoadmap.sections
            }
        });
    } catch (error) {
        console.error('Error generating roadmap:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * AI Helper Function - Generate roadmap structure
 * TODO: Replace with actual Gemini API call
 */
async function generateRoadmapWithAI(context) {
    // Mock AI response - Replace with actual Gemini API
    // In production, call: const response = await fetch('https://generativelanguage.googleapis.com/v1/...')

    return {
        title: `Lộ trình ${context.input.targetRole}`,
        description: `Lộ trình phát triển từ ${context.input.currentLevel} đến ${context.input.targetRole} trong ${context.input.timeframe}`,
        sections: [
            {
                title: 'Kiến thức nền tảng',
                description: 'Xây dựng nền tảng vững chắc',
                color: '#FF6B6B',
                lessons: [
                    {
                        title: 'Giới thiệu về ngành',
                        description: 'Tổng quan về ngành nghề và cơ hội việc làm',
                        duration: 120,
                        content: { type: 'overview', topics: ['Industry trends', 'Career paths'] }
                    },
                    {
                        title: 'Kỹ năng cơ bản',
                        description: 'Các kỹ năng thiết yếu cần có',
                        duration: 180,
                        content: { type: 'skills', list: ['Communication', 'Problem solving'] }
                    }
                ]
            },
            {
                title: 'Kỹ năng chuyên môn',
                description: 'Phát triển kỹ năng chuyên sâu',
                color: '#4ECDC4',
                lessons: [
                    {
                        title: 'Công cụ và công nghệ',
                        description: 'Làm quen với các công cụ phổ biến',
                        duration: 240,
                        content: { type: 'tools', tools: ['Tool 1', 'Tool 2'] }
                    },
                    {
                        title: 'Dự án thực tế',
                        description: 'Thực hành qua các dự án',
                        duration: 480,
                        content: { type: 'project', projects: ['Project 1', 'Project 2'] }
                    }
                ]
            },
            {
                title: 'Phát triển nâng cao',
                description: 'Chuẩn bị cho vị trí mục tiêu',
                color: '#95E1D3',
                lessons: [
                    {
                        title: 'Chuyên sâu kỹ thuật',
                        description: 'Nâng cao kỹ năng chuyên môn',
                        duration: 360,
                        content: { type: 'advanced', topics: ['Advanced topic 1'] }
                    },
                    {
                        title: 'Chuẩn bị phỏng vấn',
                        description: 'Tips và tricks cho buổi phỏng vấn',
                        duration: 120,
                        content: { type: 'interview', tips: ['Tip 1', 'Tip 2'] }
                    }
                ]
            }
        ]
    };
}

/**
 * PUT /api/ai/roadmaps/:id/lessons/:lessonId/complete
 * @desc Mark a lesson as completed
 */
router.put('/roadmaps/:id/lessons/:lessonId/complete', authenticateToken, candidateOnly, async (req, res) => {
    try {
        const { id: roadmapId, lessonId } = req.params;

        // Verify ownership
        const { data: roadmap } = await supabase
            .from('roadmaps')
            .select('user_id')
            .eq('id', roadmapId)
            .single();

        if (!roadmap || roadmap.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Roadmap not found' });
        }

        // Update lesson
        const { error: lessonError } = await supabase
            .from('roadmap_lessons')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', lessonId);

        if (lessonError) throw lessonError;

        // Record progress
        await supabase
            .from('user_roadmap_progress')
            .upsert({
                user_id: req.user.id,
                roadmap_id: roadmapId,
                lesson_id: lessonId,
                completed_at: new Date().toISOString()
            });

        // Recalculate roadmap progress
        const { data: progressResult } = await supabase
            .rpc('calculate_roadmap_progress', { roadmap_uuid: roadmapId });

        res.json({
            message: 'Lesson completed',
            progress: progressResult
        });
    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/chat
 * @desc Chat with AI career advisor (saves history for logged-in users)
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user?.id || null;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Save user message (if logged in)
        if (userId) {
            await supabase
                .from('ai_chat_history')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    role: 'user',
                    message
                });
        }

        // TODO: Call Gemini API here
        const aiResponse = `This is a mock AI response. Integrate Gemini API here. User asked: "${message}"`;

        // Save AI response (if logged in)
        if (userId) {
            await supabase
                .from('ai_chat_history')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    role: 'assistant',
                    message: aiResponse
                });
        }

        res.json({
            message: aiResponse,
            sessionId: sessionId || null
        });
    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/chat/history
 * @desc Get chat history for logged-in user
 */
router.get('/chat/history', authenticateToken, async (req, res) => {
    try {
        const { sessionId, limit = 50 } = req.query;

        let query = supabase
            .from('ai_chat_history')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ history: data });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
