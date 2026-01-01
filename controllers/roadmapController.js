const { supabase } = require('../config/supabase');

// =====================================================
// ROADMAP CRUD OPERATIONS
// =====================================================

/**
 * Lấy danh sách tất cả roadmaps của user
 */
const getRoadmaps = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, category, page = 1, limit = 10 } = req.query;

        let query = supabase
            .from('roadmaps')
            .select(`
                *,
                roadmap_sections(
                    id,
                    title,
                    order_index,
                    status,
                    color
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Filter by status if provided
        if (status) {
            query = query.eq('status', status);
        }

        // Filter by category if provided
        if (category) {
            query = query.eq('category', category);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Lỗi lấy danh sách roadmaps:', error);
            throw error;
        }

        // Get total count
        const { count: totalCount } = await supabase
            .from('roadmaps')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        res.json({
            success: true,
            data: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi server khi lấy roadmaps:', error);
        res.status(500).json({
            error: 'Lỗi server khi lấy danh sách lộ trình'
        });
    }
};

/**
 * Lấy chi tiết một roadmap với đầy đủ sections, lessons, skills, resources
 */
const getRoadmapById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get roadmap with full nested data
        const { data: roadmap, error } = await supabase
            .from('roadmaps')
            .select(`
                *,
                roadmap_sections(
                    *,
                    roadmap_lessons(
                        *,
                        roadmap_skills(*),
                        roadmap_resources(*)
                    )
                )
            `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    error: 'Không tìm thấy lộ trình'
                });
            }
            throw error;
        }

        // Sort sections and lessons by order_index
        if (roadmap.roadmap_sections) {
            roadmap.roadmap_sections.sort((a, b) => a.order_index - b.order_index);
            roadmap.roadmap_sections.forEach(section => {
                if (section.roadmap_lessons) {
                    section.roadmap_lessons.sort((a, b) => a.order_index - b.order_index);
                }
            });
        }

        res.json({
            success: true,
            data: roadmap
        });
    } catch (error) {
        console.error('Lỗi server khi lấy chi tiết roadmap:', error);
        res.status(500).json({
            error: 'Lỗi server khi lấy chi tiết lộ trình'
        });
    }
};

/**
 * Tạo roadmap mới
 */
const createRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, category, sections } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                error: 'Tiêu đề lộ trình là bắt buộc'
            });
        }

        // Create roadmap
        const { data: roadmap, error: roadmapError } = await supabase
            .from('roadmaps')
            .insert([{
                user_id: userId,
                title: title.trim(),
                description: description?.trim() || null,
                category: category || null,
                status: 'active',
                progress: 0
            }])
            .select()
            .single();

        if (roadmapError) {
            console.error('Lỗi tạo roadmap:', roadmapError);
            throw roadmapError;
        }

        // If sections are provided, create them
        if (sections && sections.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];

                // Create section
                const { data: newSection, error: sectionError } = await supabase
                    .from('roadmap_sections')
                    .insert([{
                        roadmap_id: roadmap.id,
                        title: section.title,
                        description: section.description || null,
                        order_index: i,
                        color: section.color || '#0066FF',
                        icon: section.icon || null
                    }])
                    .select()
                    .single();

                if (sectionError) {
                    console.error('Lỗi tạo section:', sectionError);
                    continue;
                }

                // Create lessons for this section
                if (section.lessons && section.lessons.length > 0) {
                    for (let j = 0; j < section.lessons.length; j++) {
                        const lesson = section.lessons[j];

                        const { data: newLesson, error: lessonError } = await supabase
                            .from('roadmap_lessons')
                            .insert([{
                                section_id: newSection.id,
                                title: lesson.title,
                                description: lesson.description || null,
                                content: lesson.content || null,
                                order_index: j,
                                duration_minutes: lesson.duration_minutes || null
                            }])
                            .select()
                            .single();

                        if (lessonError) {
                            console.error('Lỗi tạo lesson:', lessonError);
                            continue;
                        }

                        // Create skills for this lesson
                        if (lesson.skills && lesson.skills.length > 0) {
                            const skillsData = lesson.skills.map((skill, idx) => ({
                                lesson_id: newLesson.id,
                                name: typeof skill === 'string' ? skill : skill.name,
                                description: typeof skill === 'object' ? skill.description : null,
                                order_index: idx
                            }));

                            await supabase
                                .from('roadmap_skills')
                                .insert(skillsData);
                        }

                        // Create resources for this lesson
                        if (lesson.resources && lesson.resources.length > 0) {
                            const resourcesData = lesson.resources.map((resource, idx) => ({
                                lesson_id: newLesson.id,
                                title: typeof resource === 'string' ? resource : resource.title,
                                url: typeof resource === 'object' ? resource.url : null,
                                type: typeof resource === 'object' ? resource.type : 'article',
                                order_index: idx
                            }));

                            await supabase
                                .from('roadmap_resources')
                                .insert(resourcesData);
                        }
                    }
                }
            }
        }

        // Fetch the complete roadmap with all relations
        const { data: completeRoadmap } = await supabase
            .from('roadmaps')
            .select(`
                *,
                roadmap_sections(
                    *,
                    roadmap_lessons(
                        *,
                        roadmap_skills(*),
                        roadmap_resources(*)
                    )
                )
            `)
            .eq('id', roadmap.id)
            .single();

        res.status(201).json({
            success: true,
            message: 'Tạo lộ trình thành công',
            data: completeRoadmap
        });

    } catch (error) {
        console.error('Lỗi server khi tạo roadmap:', error);
        res.status(500).json({
            error: 'Lỗi server khi tạo lộ trình'
        });
    }
};

/**
 * Cập nhật roadmap
 */
const updateRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description, category, status } = req.body;

        // Check ownership
        const { data: existingRoadmap, error: checkError } = await supabase
            .from('roadmaps')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (checkError || !existingRoadmap) {
            return res.status(404).json({
                error: 'Không tìm thấy lộ trình hoặc không có quyền chỉnh sửa'
            });
        }

        // Build update object
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (category !== undefined) updateData.category = category;
        if (status !== undefined) updateData.status = status;

        // Update roadmap
        const { data: updatedRoadmap, error: updateError } = await supabase
            .from('roadmaps')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message: 'Cập nhật lộ trình thành công',
            data: updatedRoadmap
        });

    } catch (error) {
        console.error('Lỗi server khi cập nhật roadmap:', error);
        res.status(500).json({
            error: 'Lỗi server khi cập nhật lộ trình'
        });
    }
};

/**
 * Xóa roadmap
 */
const deleteRoadmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check ownership and delete (cascade will handle related records)
        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Xóa lộ trình thành công'
        });

    } catch (error) {
        console.error('Lỗi server khi xóa roadmap:', error);
        res.status(500).json({
            error: 'Lỗi server khi xóa lộ trình'
        });
    }
};

// =====================================================
// SECTION OPERATIONS
// =====================================================

/**
 * Thêm section vào roadmap
 */
const addSection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId } = req.params;
        const { title, description, color, icon } = req.body;

        // Check roadmap ownership
        const { data: roadmap, error: checkError } = await supabase
            .from('roadmaps')
            .select('id')
            .eq('id', roadmapId)
            .eq('user_id', userId)
            .single();

        if (checkError || !roadmap) {
            return res.status(404).json({
                error: 'Không tìm thấy lộ trình hoặc không có quyền'
            });
        }

        // Get max order_index
        const { data: maxOrder } = await supabase
            .from('roadmap_sections')
            .select('order_index')
            .eq('roadmap_id', roadmapId)
            .order('order_index', { ascending: false })
            .limit(1);

        const newOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0;

        // Create section
        const { data: section, error } = await supabase
            .from('roadmap_sections')
            .insert([{
                roadmap_id: roadmapId,
                title: title.trim(),
                description: description?.trim() || null,
                color: color || '#0066FF',
                icon: icon || null,
                order_index: newOrderIndex
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Thêm phần mới thành công',
            data: section
        });

    } catch (error) {
        console.error('Lỗi server khi thêm section:', error);
        res.status(500).json({
            error: 'Lỗi server khi thêm phần mới'
        });
    }
};

/**
 * Cập nhật section
 */
const updateSection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sectionId } = req.params;
        const { title, description, color, icon, status } = req.body;

        // Check ownership through roadmap
        const { data: section, error: checkError } = await supabase
            .from('roadmap_sections')
            .select(`
                id,
                roadmaps!inner(user_id)
            `)
            .eq('id', sectionId)
            .single();

        if (checkError || !section || section.roadmaps.user_id !== userId) {
            return res.status(404).json({
                error: 'Không tìm thấy phần hoặc không có quyền'
            });
        }

        // Update section
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (color !== undefined) updateData.color = color;
        if (icon !== undefined) updateData.icon = icon;
        if (status !== undefined) updateData.status = status;

        const { data: updatedSection, error } = await supabase
            .from('roadmap_sections')
            .update(updateData)
            .eq('id', sectionId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Cập nhật phần thành công',
            data: updatedSection
        });

    } catch (error) {
        console.error('Lỗi server khi cập nhật section:', error);
        res.status(500).json({
            error: 'Lỗi server khi cập nhật phần'
        });
    }
};

/**
 * Xóa section
 */
const deleteSection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sectionId } = req.params;

        // Check ownership through roadmap
        const { data: section, error: checkError } = await supabase
            .from('roadmap_sections')
            .select(`
                id,
                roadmaps!inner(user_id)
            `)
            .eq('id', sectionId)
            .single();

        if (checkError || !section || section.roadmaps.user_id !== userId) {
            return res.status(404).json({
                error: 'Không tìm thấy phần hoặc không có quyền'
            });
        }

        // Delete section (cascade will handle lessons, skills, resources)
        const { error } = await supabase
            .from('roadmap_sections')
            .delete()
            .eq('id', sectionId);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Xóa phần thành công'
        });

    } catch (error) {
        console.error('Lỗi server khi xóa section:', error);
        res.status(500).json({
            error: 'Lỗi server khi xóa phần'
        });
    }
};

// =====================================================
// LESSON OPERATIONS
// =====================================================

/**
 * Thêm lesson vào section
 */
const addLesson = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sectionId } = req.params;
        const { title, description, content, duration_minutes, skills, resources } = req.body;

        // Check section ownership through roadmap
        const { data: section, error: checkError } = await supabase
            .from('roadmap_sections')
            .select(`
                id,
                roadmaps!inner(user_id)
            `)
            .eq('id', sectionId)
            .single();

        if (checkError || !section || section.roadmaps.user_id !== userId) {
            return res.status(404).json({
                error: 'Không tìm thấy phần hoặc không có quyền'
            });
        }

        // Get max order_index
        const { data: maxOrder } = await supabase
            .from('roadmap_lessons')
            .select('order_index')
            .eq('section_id', sectionId)
            .order('order_index', { ascending: false })
            .limit(1);

        const newOrderIndex = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0;

        // Create lesson
        const { data: lesson, error } = await supabase
            .from('roadmap_lessons')
            .insert([{
                section_id: sectionId,
                title: title.trim(),
                description: description?.trim() || null,
                content: content || null,
                duration_minutes: duration_minutes || null,
                order_index: newOrderIndex
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Add skills if provided
        if (skills && skills.length > 0) {
            const skillsData = skills.map((skill, idx) => ({
                lesson_id: lesson.id,
                name: typeof skill === 'string' ? skill : skill.name,
                description: typeof skill === 'object' ? skill.description : null,
                order_index: idx
            }));
            await supabase.from('roadmap_skills').insert(skillsData);
        }

        // Add resources if provided
        if (resources && resources.length > 0) {
            const resourcesData = resources.map((resource, idx) => ({
                lesson_id: lesson.id,
                title: typeof resource === 'string' ? resource : resource.title,
                url: typeof resource === 'object' ? resource.url : null,
                type: typeof resource === 'object' ? resource.type : 'article',
                order_index: idx
            }));
            await supabase.from('roadmap_resources').insert(resourcesData);
        }

        // Fetch complete lesson
        const { data: completeLesson } = await supabase
            .from('roadmap_lessons')
            .select(`
                *,
                roadmap_skills(*),
                roadmap_resources(*)
            `)
            .eq('id', lesson.id)
            .single();

        res.status(201).json({
            success: true,
            message: 'Thêm bài học thành công',
            data: completeLesson
        });

    } catch (error) {
        console.error('Lỗi server khi thêm lesson:', error);
        res.status(500).json({
            error: 'Lỗi server khi thêm bài học'
        });
    }
};

/**
 * Cập nhật trạng thái lesson (đánh dấu hoàn thành)
 */
const updateLessonStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId } = req.params;
        const { status } = req.body;

        // Check ownership through section -> roadmap
        const { data: lesson, error: checkError } = await supabase
            .from('roadmap_lessons')
            .select(`
                id,
                section_id,
                roadmap_sections!inner(
                    roadmap_id,
                    roadmaps!inner(user_id)
                )
            `)
            .eq('id', lessonId)
            .single();

        if (checkError || !lesson || lesson.roadmap_sections.roadmaps.user_id !== userId) {
            return res.status(404).json({
                error: 'Không tìm thấy bài học hoặc không có quyền'
            });
        }

        // Update lesson status
        const updateData = { status };
        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        const { data: updatedLesson, error } = await supabase
            .from('roadmap_lessons')
            .update(updateData)
            .eq('id', lessonId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Recalculate roadmap progress
        const roadmapId = lesson.roadmap_sections.roadmap_id;
        await supabase.rpc('calculate_roadmap_progress', { roadmap_uuid: roadmapId });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái bài học thành công',
            data: updatedLesson
        });

    } catch (error) {
        console.error('Lỗi server khi cập nhật lesson status:', error);
        res.status(500).json({
            error: 'Lỗi server khi cập nhật trạng thái bài học'
        });
    }
};

// =====================================================
// PROGRESS TRACKING
// =====================================================

/**
 * Lấy thống kê tiến độ của user
 */
const getProgressStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all roadmaps with progress
        const { data: roadmaps, error } = await supabase
            .from('roadmaps')
            .select(`
                id,
                title,
                progress,
                total_sections,
                completed_sections,
                category,
                status
            `)
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) {
            throw error;
        }

        // Calculate stats
        const totalRoadmaps = roadmaps.length;
        const averageProgress = totalRoadmaps > 0
            ? Math.round(roadmaps.reduce((sum, r) => sum + r.progress, 0) / totalRoadmaps)
            : 0;
        const completedRoadmaps = roadmaps.filter(r => r.progress === 100).length;
        const inProgressRoadmaps = roadmaps.filter(r => r.progress > 0 && r.progress < 100).length;

        res.json({
            success: true,
            data: {
                totalRoadmaps,
                averageProgress,
                completedRoadmaps,
                inProgressRoadmaps,
                roadmapsByCategory: roadmaps.reduce((acc, r) => {
                    const cat = r.category || 'other';
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                }, {}),
                roadmaps
            }
        });

    } catch (error) {
        console.error('Lỗi server khi lấy progress stats:', error);
        res.status(500).json({
            error: 'Lỗi server khi lấy thống kê tiến độ'
        });
    }
};

module.exports = {
    // Roadmap CRUD
    getRoadmaps,
    getRoadmapById,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
    // Section operations
    addSection,
    updateSection,
    deleteSection,
    // Lesson operations
    addLesson,
    updateLessonStatus,
    // Progress
    getProgressStats
};
