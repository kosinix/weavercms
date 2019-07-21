//// Core modules
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

//// External modules
const express = require('express');
const bcrypt = require('bcrypt');
const lodash = require('lodash');

//// Modules
const balido = require('./balido');

module.exports = (app, config, cred, db, weaver)=>{

    let router = express.Router();
    let fromErrToArray = (err) => {
        let arr = [];
        if(err instanceof Error){
            arr.push(err.message);
        } else if (err instanceof Array){
            arr = err;
        } else if (err instanceof Object){
            arr = JSON.stringify(err);
        } else {
            arr.push('Cannot convert error.');
        }
        return arr;
    };
    router.get('/', (req, res)=>{
        res.redirect('/admin/dashboard.html');
    });

    router.get('/login.html', (req, res)=>{
        let redirectTo = req.query.redirect_to || '';
        
        res.render('login.html', {redirectTo:redirectTo});
    });

    router.post('/login.json', async (req, res)=>{
        try{
            // let redirectTo = req.body.redirectTo || '/admin/';
            // TODO: whitelisted redirect urls
            let redirectTo = '/admin/';
            let username = req.body.username || '';
            let password = req.body.password || '';
            let remember = req.body.remember || false;

            let users = await db.User.findAll({where: {username: username}});
            if(!users.length){
                throw new Error('User not found.')
            }
            let match = await bcrypt.compare(password, users[0].dataValues.password);
            if(!match){
                throw new Error('Password incorrect.')
            }
            req.session.auth = users[0];
            req.session.csrf = crypto.randomBytes(16).toString('hex'); // CSRF token
            res.json({
                redirectTo: redirectTo
            });
        } catch (err){
            res.status(400).json(fromErrToArray(err));
        }
    });

    router.get('/logout.html', (req, res)=>{
        req.session.auth = false;
        req.session.csrf = false;

        res.app.locals.auth = req.session.auth;
        res.app.locals.csrf = req.session.csrf;

        res.render('logout.html');
    });

    router.get('/dashboard.html', (req, res)=>{
       res.render('dashboard.html');
    });

    // Pages
    router.get('/pages.html', async (req, res, next) => {
        try {
            let pages = await db.Page.findAll();
            res.render('pages.html', {pages: pages});

        } catch(err){

            next(err);
        }
    });

    router.get('/page-update.html', async (req, res, next) => {
        let pageId = req.query.page_id || 0;

        let page = await db.Page.findById(pageId);

        res.render('page-update.html', {page:page} );

    });

    router.post('/page-update.json', async (req, res, next) => {
        try {
            let defaults = {
                id: 0,
                title: '',
                location: '',
                content: ''
            };

            let post = Object.assign(defaults, req.body);
            let page = await db.Page.findById(post.id);

            let validationResult = [];
            validationResult.push(balido.validate(post.csrf, 'csrf', true).ifUndefined('CSRF missing.').ifBlank('CSRF is blank.'));
            validationResult.push(balido.validate(post.id, 'id', true).ifUndefined('ID missing.').ifBlank('ID is blank.'));
            validationResult.push(balido.validate(post.title, 'title', true).ifUndefined('Title missing.').ifBlank('Title is blank.'));
            validationResult.push(balido.validate(post.location, 'location', true).ifUndefined('Location missing.').ifBlank('Location is blank.'));

            let validationErrors = balido.getErrors(validationResult);
            if (!lodash.isEmpty(validationErrors)) {
                throw validationErrors;
            }

            // req.checkBody('csrf', 'Security token missing.').notEmpty();
            // req.checkBody('csrf', 'Security error.').checkCsrf(req);
            // req.checkBody('page.id', 'Page not found.').notEmpty();
            // req.checkBody('page.id', 'Page ID must be an integer.').isInt();
            // req.checkBody('page.location', 'Location already taken.').isPageLocationTakenExcept(page.location); // Check if location already exist except if its the current location
            // Alternatively use `var result = yield req.getValidationResult();`
            // when using generators e.g. with co-express


            // weaverDb.run("UPDATE page SET title = ?, location = ?, content = ? WHERE id = ?", [vars.page.title, vars.page.location, vars.page.content, vars.page.id])
            //     .then(function (lastId) {
            //         // console.log('lastID', lastId);
            //
            //         unirest.get('http://localhost:3001/api/updateRoutes')
            //             .end(function (response) {
            //                 // console.log(response);
            //             });
            //
            //         res.redirect('/admin/page-update.html?page_id=' + vars.page.id + '&lastId=' + lastId);
            //     }).catch(function (error) {
            //     next(error);
            // });

            //res.render('page-update.html');
             res.json({ok:'ok'});
        } catch (err) {
            console.log(err);
            res.status(400).json(fromErrToArray(err));
        }
    });

    return router;
};