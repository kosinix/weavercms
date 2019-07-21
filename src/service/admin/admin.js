//// Core modules
const path = require('path');

//// External modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const moment = require('moment');
const lodash = require('lodash');
const querystring = require('querystring');
const Busboy = require('busboy');

module.exports = (container) => {
    // Assign vars
    let app = express();
    let nunjucksEnv = container.get('nunjucksEnv');
    let config = container.get('config');
    let session = container.get('session');
    let logger = container.get('logger');
    let random = container.get('random');
    let from = container.get('from');
    let db = container.get('db');
    let weaverUploader = require(path.join(config.app.dirs.src, 'weaverUploader'));

    //// Setup view
    nunjucksEnv.addFilter('fromNow', (date) => {
        return moment(date).fromNow();
    });
    nunjucksEnv.express(app);

    // TODO: Make it shared code
    //// Global variables - available in req.app.locals and in nunjuck as {{app}} {{admin}}
    // App
    app.locals.app = config.app;
    app.locals.app.title = 'Weaver CMS App';
    app.locals.app.description = 'A fast, hybrid content management system.';
    // Admin
    app.locals.admin = config.admin;
    app.locals.admin.title = 'Weaver CMS Admin';
    app.locals.admin.description = 'A fast, hybrid content management system.';

    //// Middlewares
    // Powered by
    app.use(function (req, res, next) {
        res.setHeader('X-Powered-By', 'WeaverCMS')
        next()
    });

    // Session middleware
    app.use(session);

    // Static dir middleware
    let setHeaders = (res, path, stat)=>{
        res.setHeader('X-Powered-By', 'WeaverCMS Static');
    }
    app.use(express.static(config.app.dirs.public, {setHeaders:setHeaders}));

    

    // Handle uploads
    app.use(bodyParser.json());       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));

    // Cookies middleware
    app.use(cookieParser());


    // Gzip response middleware
    app.use(compression());

    // Assign config middleware
    app.use((req, res, next) => {
        req.app.locals.config = config;
        next();
    });



    // Remember me middleware. Must come before auth.
    app.use( async (req, res, next) => {

        let cookieRemember = req.cookies['weaver.rem'];
        if(
            (req.session.auth === undefined || req.session.auth === false)
            && cookieRemember
        ){

            let user = await db.User.findOne({where: {remember: cookieRemember}, raw: true});

            if(user) {
                req.session.auth = user;
                req.session.csrf = random.string();// CSRF token

                let redirectUrl = config.admin.url+req.originalUrl;
                return res.redirect(redirectUrl);
            }

        }

        next();

    });

    // Auth middleware
    app.use(((opts) => {
        let defaults = {
            baseUrl: '',
            exclude:  [
                'GET/admin/login.html',
                'GET/admin/logout.html',
                'POST/admin/login.json',
            ]
        };
        opts = Object.assign(defaults, opts);
        return (req, res, next) => {
            let exclude = opts.exclude;
            let requestInfo = req.method + req.baseUrl + req.path;
            if(
                (req.session.auth === undefined || req.session.auth === false)
                && lodash.findIndex(exclude, (o)=>{ return o === requestInfo; }) === -1
            ){
                let sourceUrl = opts.baseUrl + req.originalUrl;

                let qs = querystring.stringify({
                    'redirect_to': sourceUrl
                });
                return res.redirect('/admin/login.html?'+qs);
            } else {

                next();
            }
        };
    })({baseUrl: config.admin.url}));



    // Anti-Cross-Site Request Forgery (A-CSRF) Middleware
    //// Capture csrf from post
    app.use((req, res, next) => {
        if(req.method !== 'POST'){
            next();
        } else {
            let csrfPost = lodash.trim(lodash.get(req, 'body.csrf', ''));
            
            if(csrfPost !== '' ){
                req.csrfPost = csrfPost;
                next();
            } else { 
                req.csrfPost = lodash.trim(lodash.get(req, 'headers.csrf', ''));
                next();
            }
        } 
    });
    app.use((req, res, next) => {
        let csrfSession = lodash.trim(lodash.get(req, 'session.csrf', ''));
        
        req.app.locals.csrf = csrfSession; // Add A-CSRF token globally

        let exclude = [
            'POST/admin/login.json',
        ];
        let requestInfo = req.method + req.baseUrl + req.path;

        if(req.method === 'POST' && lodash.findIndex(exclude, (o)=>{ return o === requestInfo; }) === -1){
            let csrfPost = lodash.trim(lodash.get(req, 'csrfPost', null));

            if(csrfPost===null){
                if(req.xhr){
                    return res.status(400).json(['Missing security token.']);
                } else {
                    return res.status(400).send('Missing security token.');
                }

            } else {
                if(csrfPost!==csrfSession){
                    // console.log('csrfPost', csrfPost, 'csrfSession', csrfSession)
                    if(req.xhr){
                        return res.status(400).json(['Invalid security token.']);
                    } else {
                        return res.status(400).send('Invalid security token.');

                    }
                }
            }
        }
        next();
    });


    // Body class
    app.use((req, res, next) => {
        let bodyClass = 'page' + (req.baseUrl + req.path).replace(/\//g, '-');
        bodyClass = lodash.trim(bodyClass, '-');
        bodyClass = lodash.trimEnd(bodyClass, '.html');
        req.app.locals.bodyClass = bodyClass; // global body class css
        next();
    });

    // Current path
    app.use((req, res, next) => {
        res.app.locals.currentPath = req.originalUrl;
        res.app.locals.isCurrentPath = function (current, cssClassName) {
            let path = '/admin' + req.path;
            if (Array.isArray(current)) {
                if (current.indexOf(path) !== -1) {
                    return cssClassName;
                }
            } else {
                if (current === path) {
                    return cssClassName;
                }
            }
            return '';
        };
        next();
    });

    //// Set vars
    // Indicates the app is behind a front-facing proxy, and to use the X-Forwarded-* headers to determine the connection and the IP address of the client.
    app.set('trust proxy', config.express.trustProxy);
    
    

    
    //// Routes
    // Admin routes
    app.use('/admin', container.get('routerAdmin'));

    // Error handler
    app.use(function (err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }
        if(req.xhr){

        }
        req.socket.on("error", function(err) {
            logger.error(err);
        });
        res.socket.on("error", function(err) {
            logger.error(err);
        });
        if(err.name==='WeaverResponseError'){
            if(err.type==='json'){
                return res.status(err.status).json(from.errorToArray(err.getError()));
            } else {
                return res.status(err.status).send(from.errorToText(err.getError()));
            }
        }
        logger.error(err);
        res.status(500).send('Something broke!');
    });
    return app;
};