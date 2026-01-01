const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const roadmapController = require('../controllers/roadmapController');

// =====================================================
// ROADMAP API ROUTES
// Tất cả routes đều yêu cầu authentication
// =====================================================

// Apply authentication middleware to all routes
router.use(authenticateToken);

// =====================================================
// ROADMAP CRUD
// =====================================================

/**
 * GET /api/roadmaps
 * Lấy danh sách tất cả roadmaps của user
 * Query params: status, category, page, limit
 */
router.get('/', roadmapController.getRoadmaps);

/**
 * GET /api/roadmaps/stats
 * Lấy thống kê tiến độ của user
 */
router.get('/stats', roadmapController.getProgressStats);

/**
 * GET /api/roadmaps/:id
 * Lấy chi tiết một roadmap với đầy đủ sections, lessons, skills, resources
 */
router.get('/:id', roadmapController.getRoadmapById);

/**
 * POST /api/roadmaps
 * Tạo roadmap mới
 * Body: { title, description, category, sections: [...] }
 */
router.post('/', roadmapController.createRoadmap);

/**
 * PUT /api/roadmaps/:id
 * Cập nhật roadmap
 * Body: { title?, description?, category?, status? }
 */
router.put('/:id', roadmapController.updateRoadmap);

/**
 * DELETE /api/roadmaps/:id
 * Xóa roadmap và tất cả dữ liệu liên quan
 */
router.delete('/:id', roadmapController.deleteRoadmap);

// =====================================================
// SECTION OPERATIONS
// =====================================================

/**
 * POST /api/roadmaps/:roadmapId/sections
 * Thêm section vào roadmap
 * Body: { title, description?, color?, icon? }
 */
router.post('/:roadmapId/sections', roadmapController.addSection);

/**
 * PUT /api/roadmaps/sections/:sectionId
 * Cập nhật section
 * Body: { title?, description?, color?, icon?, status? }
 */
router.put('/sections/:sectionId', roadmapController.updateSection);

/**
 * DELETE /api/roadmaps/sections/:sectionId
 * Xóa section và tất cả lessons liên quan
 */
router.delete('/sections/:sectionId', roadmapController.deleteSection);

// =====================================================
// LESSON OPERATIONS
// =====================================================

/**
 * POST /api/roadmaps/sections/:sectionId/lessons
 * Thêm lesson vào section
 * Body: { title, description?, content?, duration_minutes?, skills?: [], resources?: [] }
 */
router.post('/sections/:sectionId/lessons', roadmapController.addLesson);

/**
 * PUT /api/roadmaps/lessons/:lessonId/status
 * Cập nhật trạng thái lesson (đánh dấu hoàn thành)
 * Body: { status: 'completed' | 'in-progress' | 'pending' }
 */
router.put('/lessons/:lessonId/status', roadmapController.updateLessonStatus);

module.exports = router;
