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

module.exports = (container) => {
    // Assign vars
    let app = express();
    let nunjucksEnv = container.get('nunjucksEnv');
    let config = container.get('config');
    let session = container.get('session');
    let logger = container.get('logger');
    let db = container.get('db');

    //// Setup view
    nunjucksEnv.addFilter('fromNow', (date) => {
        return moment(date).fromNow();
    });
    nunjucksEnv.express(app);

    //// Global variables
    // App
    app.locals.app = config.app;
    app.locals.app.title = 'Weaver CMS App';
    app.locals.app.description = 'A fast, hybrid content management system.';
    // Admin
    app.locals.admin = config.admin;
    app.locals.admin.title = 'Weaver CMS Admin';
    app.locals.admin.description = 'A fast, hybrid content management system.';


    app.set('x-powered-by', false);

    //// Middlewares
    // Powered by
    app.use(function (req, res, next) {
        res.setHeader('X-Powered-By', 'WeaverCMS')
        next()
    });

    // Hook session middleware
    app.use(session);

    // Static dir middleware
    let setHeaders = (res, path, stat)=>{
        res.setHeader('X-Powered-By', 'WeaverCMS Static');
    }
    app.use(express.static( path.join(config.app.dirs.view, 'app', 'public'), {setHeaders:setHeaders}));
    app.use(express.static( path.join(config.app.dirs.public), {setHeaders:setHeaders}));

    // Config
    app.use( async (req, res, next) => {
        req.app.locals.config = config;
        let pages = await db.Page.findAll({raw:true});

        req.app.locals.nav = {
            main: {
                id: 'nav-main',
                items: []
            },
            footer: {
                id: 'nav-footer',
                items: []
            }
        };

        req.app.locals.nav.main.items = req.app.locals.nav.footer.items = pages.map((page)=>{
            return {
                url: page.location,
                name: page.title
            }
        });

        next();
    });


    // CSRF
    app.use((req, res, next) => {
        req.app.locals.csrf = (req.session.csrf !== undefined) ? req.session.csrf : ''; // CSRF token
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

    // Parse http body
    app.use(bodyParser.json());       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));

    // Cookies
    app.use(cookieParser());


    // Gzip response
    app.use(compression());

    //// Set vars
    // Indicates the app is behind a front-facing proxy, and to use the X-Forwarded-* headers to determine the connection and the IP address of the client.
    app.set('trust proxy', config.express.trustProxy);
    
    

    // Mailer
    // app.set('mailerSendmail', mailer.sendmail);
    // app.set('mailerSmtp', mailer.smtp);


    //// Routes
    // Admin routes
    app.use(container.get('routerFront'));

    // Error handler
    app.use(function (err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }
        req.socket.on("error", function(err) {
            logger.error(err);
        });
        res.socket.on("error", function(err) {
            logger.error(err);
        });
        logger.error(err);
        res.status(500).send('Something broke!');
    });
    return app;
};