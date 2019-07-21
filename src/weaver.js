//// Core modules
const path = require('path');
const fs = require('fs');

//// External modules
const lodash = require('lodash');

//// Modules
const configLoader = require('./configLoader');
const auth = require('./auth');
const error = require('./error');
const weaverLogger = require('./weaverLogger');

//// App root dir
const appDir = global.appDir;

let config = configLoader.readAndParseConfig(path.join(appDir, 'data', 'config.json'));
let cred = configLoader.readAndParseCredentials(path.join(config.app.dirs.data, 'credentials.json'));

module.exports = {
    config: config,
    cred: cred,
    error: error,
    logger: (config)=>{
        // Initialize
        return new weaverLogger.Logger({
            transports: [
                new weaverLogger.transports.Console(),
                new weaverLogger.transports.File({ filename: path.join(appDir, 'data', 'logs', 'temp.log') })
            ]
        });

    },
    middleware: {
        config: (config) => {
            return (req, res, next) => {
                req.app.locals.config = config;
                next();
            };
        },
        auth: (opts)=>{
            return auth(opts);
        },
        // Add a global anti cross-site request forgery token
        csrf: (req, res, next) => {
            req.app.locals.csrf = (req.session.csrf !== undefined) ? req.session.csrf : ''; // CSRF token
            next();
        },
        // Generated a class name for <body class=""> that uniquely identifies a page
        bodyClass: (req, res, next) => {
            let bodyClass = 'page' + (req.baseUrl + req.path).replace(/\//g, '-');
            bodyClass = lodash.trim(bodyClass, '-');
            bodyClass = lodash.trimEnd(bodyClass, '.html');
            req.app.locals.bodyClass = bodyClass; // global body class css
            next();
        },
        currentPath: (req, res, next) => {
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
        }
    }
};