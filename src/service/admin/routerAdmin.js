//// Core modules
const fs = require('fs');
const path = require('path');
const util = require('util');
const http = require('http');
const crypto = require('crypto');

//// External modules
const express = require('express');
const lodash = require('lodash');
const bcrypt = require('bcrypt');
const moment = require('moment');
const Busboy = require('busboy');
const Jimp = require('jimp');

module.exports = (container) => {
    let config = container.get('config');
    let cred = container.get('cred');
    let db = container.get('db');
    let from = container.get('from');
    // let logger = container.get('logger');
    let random = container.get('random');
    let validator = container.get('validator');
    let sanitizer = container.get('sanitizer');
    let inputGuard = container.get('inputGuard');
    let reloadFrontRoutes = container.get('reloadFrontRoutes');
    let weaverUploader = require(path.join(config.app.dirs.src, 'weaverUploader'));
    let weaverError = require(path.join(config.app.dirs.src, 'weaverError'));
    let unlink = util.promisify(fs.unlink);

    let router = express.Router();
    router.get('/', (req, res) => {
        res.redirect('/admin/dashboard.html');
    });

    router.get('/login.html', (req, res) => {
        let redirectTo = req.query.redirect_to || '';

        res.render('login.html', {redirectTo: redirectTo});
    });

    router.post('/login.json', async (req, res, next) => {
        try {
            // let redirectTo = req.body.redirectTo || '/admin/';
            // TODO: whitelisted redirect urls
            let post = inputGuard.allowedFields(req.body, {
                username: {
                    default: ''
                },
                password: {
                    default: ''
                },
                remember: {
                    default: ''
                },
                redirectTo: {
                    default: '/admin/'
                }
            });

            let user = await db.User.findOne({where: {username: post.username}});
            validator.isTrue(user, 'User not found.');

            let match = await bcrypt.compare(post.password, user.password);
            validator.isTrue(match, 'Password incorrect.');

            if(post.remember){
                let rememberMeToken = random.string(); // Remember me token
                user.remember = rememberMeToken;
                await user.save();
                res.cookie('weaver.rem', rememberMeToken, { path: '/admin', httpOnly:true, expires: new Date(Date.now() + (1000*60*60*24*7)) }); // 1 week
            }

            req.session.auth = user;
            req.session.csrf = random.string(); // CSRF token
            res.json({
                redirectTo: '/admin/'
            });
        } catch (err) {
            next(weaverError.json(err));
        }
    });

    router.get('/logout.html', async (req, res, next) => {
        try {
            let username = lodash.get(req, 'session.auth.username', '');
            let user = await db.User.findOne({where: {username: username}});
            if (user) {
                user.remember = '';
                await user.save();
            }

            req.session.auth = false;
            req.session.csrf = false;

            res.app.locals.auth = req.session.auth;
            res.app.locals.csrf = req.session.csrf;
            res.clearCookie('connect.sid', {path: '/'});
            res.clearCookie('weaver.rem', {path: '/admin'});
            res.render('logout.html');
        } catch(err){
            next(err);
        }
    });

    router.get('/dashboard.html', (req, res) => {
        res.render('dashboard.html');
    });

    // Pages
    router.get('/pages.html', async (req, res, next) => {
        try {
            let offset = parseInt(req.query.offset) || 0;
            let limit = parseInt(req.query.limit) || 10;

            let result = await db.Page.findAndCountAll({offset:offset*limit, limit:limit, raw:true});

            let totalPage = result.count;
            let pageNumbers = Math.ceil(totalPage / limit);

            let pages = result.rows.map((value, index)=>{
                value.content = lodash.truncate(value.content, {length: 80});
                value.createdAt = moment(new Date(value.createdAt)).fromNow();
                value.updatedAt = moment(new Date(value.updatedAt)).fromNow();
                return value;
            });
            res.render('pages.html', {offset: offset, limit: limit, totalPage:totalPage, pageNumbers:pageNumbers, pages: JSON.stringify(pages), screenOptionsUrl: '/admin/pages.html'});

        } catch (err) {

            next(err);
        }
    });

    // Create
    router.get('/page-create.html', async (req, res, next) => {
        try {
            let pageId = req.query.page_id || 0;

            let page = await db.Page.findById(pageId);
            res.render('page-create.html', {page: page});
        } catch (err){
            next(err);
        }
    });
    router.post('/page-create.json', async (req, res, next) => {
        try {
            let post = inputGuard.allowedFields(req.body, {
                title: {
                    default: ''
                },
                location: {
                    default: ''
                },
                content: {
                    default: ''
                }
            });

            let page = db.Page.build(post);

            let result = await page.save();

            reloadFrontRoutes.reload();

            res.json(result);
        } catch (err) {
            next(weaverError.json(err));
        }
    });

    // Update
    router.get('/page-update.html', async (req, res, next) => {
        try {
            let pageId = req.query.page_id || 0;

            let page = await db.Page.findOne({where:{id:pageId}, raw:true});
            let view = fs.readFileSync(path.join(config.app.dirs.view, 'app', 'page.html'), {encoding:'utf8'});
            let offset = 0;
            let limit = 10;
            let files = await db.File.findAndCountAll({
                offset:offset*limit, 
                limit:limit,
                include: [{
                    model: db.Variant
                }]
            });

            
            let rows = files.rows.map((node) => node.get({ plain: true }));
            console.log(rows);
            res.render('page-update.html', {page: page, files: rows, view: view});
        } catch (err){
            next(err);
        }
    });

    router.post('/page-update.json', async (req, res, next) => {
        try {
            
            let post = inputGuard.allowedFields(req.body, {
                id: {
                    default: 0
                },
                title: {
                    default: ''
                },
                location: {
                    default: ''
                },
                visibility: {
                    default: 1
                },
                static: {
                    default: 0
                },
                viewFile: {
                    default: path.join(config.app.dirs.view, 'app', 'page.html')
                },
                content: {
                    default: ''
                },
                code: {
                    default: ''
                },
                view: {
                    default: ''
                }
            });

            fs.writeFileSync(post.viewFile, post.view);

            if(post.static==='1'){
                let config = container.get('config');
                
                let location = path.join(config.app.dirs.public, post.location);
                //// Setup view
                let nunjucks = require('nunjucks');
                let dirView = path.join(config.app.dirs.view, 'app')

               
                // Setup nunjucks loader. See https://mozilla.github.io/nunjucks/api.html#loader
                let loaderFsNunjucks = new nunjucks.FileSystemLoader(dirView, config.nunjucks.loader);

                // Setup nunjucks environment. See https://mozilla.github.io/nunjucks/api.html#environment
                let nunjucksEnv = new nunjucks.Environment(loaderFsNunjucks, config.nunjucks.environment);

                let content = nunjucksEnv.render('page.html', {app:req.app.locals.app, page:post});
                fs.writeFileSync(location, content);
            } else {
                let location = path.join(config.app.dirs.public, post.location);
                fs.unlink(location, (err)=>{
                    console.log(err);
                });
            }

            

            let page = await db.Page.findById(post.id);

            await page.update({
                title: post.title,
                location: post.location,
                visibility: post.visibility,
                static: post.static,
                content: post.content,
                code: post.code,
            });

            reloadFrontRoutes.reload();

            res.json({ok: 'ok'});
        } catch (err) {
            console.log(err);
            res.status(400).json(from.errorToArray(err));
        }
    });

    // Delete
    router.post('/page-delete.json', async (req, res, next) => {
        try {
            let defaults = {
                csrf: '',
                id: 0,
                mode: '',
            };
            let post = Object.assign(defaults, req.body);

            // validator.isEqual(req.session.csrf, post.csrf, 'Security error. Anti-CSRF token dont match.');

            let page = await db.Page.findOne({ paranoid: false, where: { id: post.id }});

            validator.isTrue(page, 'Page not found.');

            let force = false;
            if(post.mode==='hard-delete'){
                force = true;
            }
            await page.destroy({force:force});

            reloadFrontRoutes.reload();


            res.json(page);
        } catch (err) {
            console.log(err);
            res.status(400).json(from.errorToArray(err));
        }
    });

    // Restore
    router.post('/page-restore.json', async (req, res, next) => {
        try {
            let defaults = {
                csrf: '',
                id: 0
            };
            let post = Object.assign(defaults, req.body);

            validator.isEqual(req.session.csrf, post.csrf, 'Security error. Anti-CSRF token dont match.');

            let page = await db.Page.findOne({ paranoid: false, where: { id: post.id }});

            validator.isTrue(page, 'Page not found.');

            await page.restore();

            reloadFrontRoutes.reload();

            res.json(page);
        } catch (err) {
            console.log(err);
            res.status(400).json(from.errorToArray(err));
        }
    });

    router.get('/page-deleted.html', async (req, res, next) => {
        try {
            let offset = parseInt(req.query.offset) || 0;
            let limit = parseInt(req.query.limit) || 10;

            let result = await db.Page.findAndCountAll({offset:offset*limit, limit:limit, raw:true, paranoid: false, where: {deletedAt: {[db.Sequelize.Op.ne]:null}}});

            let totalPage = result.count;
            let pageNumbers = Math.ceil(totalPage / limit);

            let pages = result.rows.map((value, index)=>{
                value.content = lodash.truncate(value.content, {length: 80});
                value.createdAt = moment(new Date(value.createdAt)).fromNow();
                value.updatedAt = moment(new Date(value.updatedAt)).fromNow();
                return value;
            });
            console.log(result)
            res.render('page-deleted.html', {offset: offset, limit: limit, totalPage:totalPage, pageNumbers:pageNumbers, pages: JSON.stringify(pages), screenOptionsUrl: '/admin/page-deleted.html'});

        } catch (err) {

            next(err);
        }
    });

    // Files 
    router.get('/files.html', async (req, res, next) => {
        try {
            let offset = parseInt(req.query.offset) || 0;
            let limit = parseInt(req.query.limit) || 10;

            let result = await db.File.findAndCountAll({offset:offset*limit, limit:limit, raw:true});

            let totalPage = result.count;
            let pageNumbers = Math.ceil(totalPage / limit);

            let files = result.rows.map((value, index)=>{
                // value.content = lodash.truncate(value.content, {length: 80});
                value.createdAt = moment(new Date(value.createdAt)).fromNow();
                value.updatedAt = moment(new Date(value.updatedAt)).fromNow();
                return value;
            });

            // Turn array into hashmap with file.id as keys
            // files = lodash.keyBy(files, (file)=>{
            //     return file.id;
            // });
            // console.log(files)
            res.render('files.html', {offset: offset, limit: limit, totalPage:totalPage, pageNumbers:pageNumbers, files: JSON.stringify(files), screenOptionsUrl: '/admin/files.html'});

        } catch (err) {

            next(err);
        }
    });

    router.get('/file-create.html', (req, res) => {
        res.render('file-create.html');
    });

    router.post('/upload.json', async (req, res, next) => {
        try {

            let uploadDir = config.app.dirs.upload; 
            let upload = await weaverUploader.handleUpload( req, uploadDir, {});
            
            let ext = path.extname(upload.name);
            let finalName = crypto.randomBytes(16).toString('hex') + ext; // Rename into a random string + original file extension
            let finalPath = path.join(uploadDir, finalName);

            // Rename temp name to final name
            fs.renameSync(upload.path, finalPath);

            let file = await db.File.create({
                uid: finalName,
                originalName: upload.name,
                title: path.basename(upload.name, ext),
                type: upload.mimeType
            });
            await file.save();

            // Create variants based on global settings
            let variantOptions = [
                {
                    name: "small",
                    width: 100,
                    height: 100,
                    mode: "fit",
                    position: "top-left"
                },
                {
                    name: "medium",
                    width: 350,
                    height: 350,
                    mode: "fit",
                    position: "center"
                }
            ];

            let image = await Jimp.read(finalPath);
            
            variantOptions.forEach(async(variantOption)=>{
                let imageVariant = image.clone();
                let anchorPoint = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE;
                let anchorX = 1;
                let anchorY = 1;
                if(variantOption.anchorPoint==="top-left"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_TOP;
                    anchorX = 0;
                    anchorY = 0;
                } else if(variantOption.anchorPoint==="top-center"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP;
                    anchorX = 1;
                    anchorY = 0;
                } else if(variantOption.anchorPoint==="top-right"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_RIGHT | Jimp.VERTICAL_ALIGN_TOP;
                    anchorX = 2;
                    anchorY = 0;
                } else if(variantOption.anchorPoint==="center-left"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_MIDDLE;
                    anchorX = 0;
                    anchorY = 1;
                } else if(variantOption.anchorPoint==="center-right"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_RIGHT | Jimp.VERTICAL_ALIGN_MIDDLE;
                    anchorX = 2;
                    anchorY = 1;
                } else if(variantOption.anchorPoint==="bottom-left"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_BOTTOM;
                    anchorX = 0;
                    anchorY = 2;
                } else if(variantOption.anchorPoint==="bottom-center"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_BOTTOM;
                    anchorX = 1;
                    anchorY = 2;
                } else if(variantOption.anchorPoint==="bottom-right"){
                    anchorPoint = Jimp.HORIZONTAL_ALIGN_RIGHT | Jimp.VERTICAL_ALIGN_BOTTOM;
                    anchorX = 2;
                    anchorY = 2;
                }
                if(variantOption.mode === "fit"){
                    imageVariant.contain( variantOption.width, variantOption.height, anchorPoint );
                } else if ( variantOption.mode === "fill"){
                    imageVariant.cover( variantOption.width, variantOption.height, anchorPoint );
                } else if ( variantOption.mode === "exactWidth"){
                    imageVariant.resize(variantOption.width, Jimp.AUTO);
                } else if ( variantOption.mode === "exactHeight"){
                    imageVariant.resize(Jimp.AUTO, variantOption.height);
                } else if ( variantOption.mode === "exact"){
                    imageVariant.resize( variantOption.width, variantOption.height);
                } else if ( variantOption.mode === "crop"){
                    imageVariant.crop( 0, 0, variantOption.width, variantOption.height);
                }

                let variantUid = crypto.randomBytes(16).toString('hex') + path.extname(upload.name); // Rename into a random string + original file extension
                let variantPath = path.join(uploadDir, variantUid);
                imageVariant.background(0xFFFFFFFF);
                imageVariant.write(variantPath);

                let variant = await db.Variant.create({
                    uid: variantUid,
                    parentUid: finalName,
                    name: variantOption.name,
                    anchorX: anchorX,
                    anchorY: anchorY,
                    width: variantOption.width, 
                    height: variantOption.height,
                    mode: variantOption.mode,
                });
                await variant.save();
            })
            

            res.status(200).json(['Upload finish']);

        } catch(err) {
            res.status(400).send(from.errorToText(err));
        }
    });

    router.get('/file-read', async (req, res, next) => {
        try {
            let query = inputGuard.allowedFields(req.query, {
                uid: {
                    default: "",
                },
                variant: {
                    default: ""
                }
            });

            let uploadDir = config.app.dirs.upload;

            let file = null;
            if(query.variant!==""){
                file = await db.Variant.findOne({
                    where: { 
                        parentUid: query.uid,
                        name: query.variant
                    }
                });
                
            } else {
                file = await db.File.findOne({ where: { uid: query.uid }});
                
            }
            console.log(query.variant)
            if(file){
                res.sendFile( path.join(uploadDir, file.uid));
            } else {
                res.status(404).send();
            }
        } catch(err) {
            next(err);
        }

    });

    router.get('/file-update.html', async (req, res, next) => {
        try {
            let query = inputGuard.allowedFields(req.query, {
                uid: {
                    default: "",
                }
            });

            let file = await db.File.findOne({where: { uid: query.uid } });
            res.render('file-update.html', {file: file});

        } catch(err) {
            next(err);
        }

    });

    router.post('/file-delete.json', async (req, res, next) => {
        try {
            let post = inputGuard.allowedFields(req.body, {
                id: {
                    default: 0
                }
            });

            let result = await db.sequelize.transaction( async (t)=> {
                let uploadDir = config.app.dirs.upload;
                
                let file = await db.File.findOne({where: {id: post.id}}); // We only know the ID, we need the location
                
                if(!file) throw new Error('File not found.');
                
                let variants = await db.Variant.findAll({where: {parentUid: file.uid}}); // We only know the ID, we need the location
                
                variants.forEach(async(variant)=>{
                    await variant.destroy({transaction: t, force: true});
                    await unlink(path.join(uploadDir, variant.uid));
                    
                });
                await file.destroy({transaction: t, force: true});
                await unlink(path.join(uploadDir, file.uid));
                
                return file;

            });
            
            // console.log(result);
            res.json({ok:'ok'});
        } catch (err) {

            next(err);
        }
    });
    router.use((req, res) => {
        res.status(404).render('page-404.html', {title: 'Error 404', content:'Page not found.'});
    });
    return router;
};