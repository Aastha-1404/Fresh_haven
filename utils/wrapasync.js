// Forward rejected async route promises to Express error middleware.
module.exports = function wrapAsync(routeHandler) {
    return function wrappedRouteHandler(req, res, next) {
        Promise.resolve(routeHandler(req, res, next)).catch(next);
    };
};
