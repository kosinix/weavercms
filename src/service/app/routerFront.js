//// Core modules
const path = require('path');
const vm = require('vm');

//// External modules
const express = require('express');
const lodash = require('lodash');

module.exports = (container) => {
    let config = container.get('config');
    let cred = container.get('cred');
    let db = container.get('db');
    let logger = container.get('logger');
    let routeReloader = require( path.join(config.app.dirs.src, 'routeReloader') );
    let router = express.Router();

    // Listen to dynamic routes
    let reloader = new routeReloader.RouteReloader();
    router.use(reloader.handler());


    let attachPages = (pages)=>{
        // Dynamic
        let dynamicRoutes = express.Router();
        pages.forEach(
            (page) => {
                logger.log('Adding '+page.location);
                dynamicRoutes.get(page.location, async (req, res, next) => {
                    try {
                        let code = lodash.trim(page.code) || '';
                        // let pagePlain = page.get({plain: true});
                        let sandbox = {
                            app: Object.assign({}, config.app),
                            admin: Object.assign({}, config.admin),
                            request: req,
                            response: res,
                            page: Object.assign({}, page),
                            view: Object.assign({}, {page:page})
                        };
                        vm.createContext(sandbox);
                        vm.runInContext(code, sandbox, {timeout:1000});

                        let viewVars = Object.assign({}, sandbox.view);
                        // console.log('viewVars', viewVars);

                        res.render('page.html', viewVars);
                    } catch(err) {
                        next(err);
                    }
                });
            }
        );
        reloader.load(dynamicRoutes);

    };

    db.Page.findAll({raw:true}).then( attachPages, function(err){
        console.log(err);
    });

    let apiRoutes = express.Router();
    apiRoutes.get('/api/routes/reload', (req, res)=>{
        if(req.query.key !== cred.app.secret){
            console.log('fail key');
            return res.status(200).send('fail');
        }
        

        db.Page.findAll({raw:true}).then( (pages)=>{
            attachPages(pages);
            // Begin
            logger.log('Routes reloaded while app is running...');
            res.send('Done');
            
        }, (err)=>{
            console.log(err);
            res.status(400).send('Failed');
        });
    });

    // Register routes
    router.use(apiRoutes);

    // 404 Page
    router.use((req, res) => {
        res.status(404).render('page.html', {page: {title: 'Error 404', content:'Page not found.'}});
    });
    return router;
};