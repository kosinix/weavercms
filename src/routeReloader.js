// Route reloader
class RouteReloader {
    constructor() {
        this.router = null; // Is an express.Router();
    }
    handler() {
        return (req, res, next) => {
            if(this.router!==null) this.router(req, res, next);
        };
    }
    load(newRouter) {
        this.router = newRouter;
    }
}
module.exports = {
    RouteReloader: RouteReloader
};


