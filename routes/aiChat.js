/**
 * AI Chatbot Routes - Enhanced with Supabase Integration
 * Routes cho AI chatbot kết nối với Supabase backend
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/ai-chat/session/create
 * Tạo session mới cho chatbot
 */
router.post('/session/create', async (req, res) => {
    try {
        const { fieldId } = req.body;

        // Tạo session ID
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 15);
        const session_id = `${timestamp}-${randomPart}`;

        // Trả về session ID
        res.json({
            success: true,
            data: {
                session_id,
                field_id: fieldId,
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo session',
            error: error.message
        });
    }
});

/**
 * POST /api/ai-chat/message/send
 * Gửi tin nhắn đến AI chatbot
 * 
 * Body:
 * - session_id: ID của session
 * - message: Nội dung tin nhắn
 * - field_id: ID của lĩnh vực học tập (optional)
 */
router.post('/message/send', async (req, res) => {
    try {
        const { session_id, message, field_id } = req.body;

        if (!session_id || !message) {
            return res.status(400).json({
                success: false,
                message: 'session_id và message là bắt buộc'
            });
        }

        // Forward request to Supabase Edge Function
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(500).json({
                success: false,
                message: 'Supabase configuration is missing'
            });
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/chat-submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                session_id,
                message,
                field_id
            })
        });

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.statusText}`);
        }

        // Stream response back to client
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể gửi tin nhắn',
            error: error.message
        });
    }
});

/**
 * GET /api/ai-chat/status/:jobId
 * Lấy trạng thái của job
 */
router.get('/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(500).json({
                success: false,
                message: 'Supabase configuration is missing'
            });
        }

        const response = await fetch(
            `${supabaseUrl}/functions/v1/chat-status?job_id=${jobId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy trạng thái job',
            error: error.message
        });
    }
});

/**
 * POST /api/ai-chat/session/status
 * Lấy trạng thái của session
 * 
 * Body:
 * - session_id: ID của session
 * - limit: Số lượng jobs tối đa trả về (default: 10)
 */
router.post('/session/status', async (req, res) => {
    try {
        const { session_id, limit = 10 } = req.body;

        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id là bắt buộc'
            });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(500).json({
                success: false,
                message: 'Supabase configuration is missing'
            });
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/chat-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                session_id,
                limit
            })
        });

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy trạng thái session',
            error: error.message
        });
    }
});

/**
 * GET /api/ai-chat/fields
 * Lấy danh sách các lĩnh vực học tập (fields)
 */
router.get('/fields', async (req, res) => {
    try {
        // Mock data - trong production sẽ query từ Supabase
        const fields = [
            {
                id: 'marketing',
                name: 'Marketing',
                description: 'Học digital marketing và quản lý thương hiệu'
            },
            {
                id: 'ui-ux',
                name: 'UI/UX Design',
                description: 'Thiết kế giao diện và trải nghiệm người dùng'
            },
            {
                id: 'graphic-design',
                name: 'Graphic Design',
                description: 'Phát triển kỹ năng thiết kế đồ họa'
            },
            {
                id: 'mobile-dev',
                name: 'Mobile Development',
                description: 'Phát triển ứng dụng di động'
            },
            {
                id: 'web-dev',
                name: 'Web Development',
                description: 'Phát triển website và ứng dụng web'
            }
        ];

        res.json({
            success: true,
            data: fields
        });

    } catch (error) {
        console.error('Error getting fields:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách lĩnh vực',
            error: error.message
        });
    }
});

module.exports = router;
