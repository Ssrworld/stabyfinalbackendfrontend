/**
 * Admin Middleware
 * Checks if the logged-in user is the admin.
 * The admin is defined as the user with ID = 1 (the first registered user).
 */
module.exports = (req, res, next) => {
    // The user object (req.user) is added by the auth.middleware
    // It contains the payload from the JWT, which includes the user's ID and email.
    if (req.user && req.user.id === 1) {
        // If the user's ID is 1, they are the admin. Proceed to the next step.
        next();
    } else {
        // If the user's ID is not 1, deny access with a 403 Forbidden status.
        return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
};