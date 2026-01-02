// Guest Protection Middleware
// Blocks unauthenticated users from accessing protected routes

const guestProtection = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Vui lòng đăng nhập để sử dụng chức năng này',
            code: 'AUTH_REQUIRED'
        });
    }
    next();
};

// Role-based Protection
const roleProtection = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Vui lòng đăng nhập'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }

        next();
    };
};

// Candidate Only
const candidateOnly = roleProtection(['candidate']);

// Employer Only
const employerOnly = roleProtection(['employer']);

// Admin Only
const adminOnly = roleProtection(['admin']);

module.exports = {
    guestProtection,
    roleProtection,
    candidateOnly,
    employerOnly,
    adminOnly
};
