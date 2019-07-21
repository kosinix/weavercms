//// Core modules
const path = require('path');
const fs = require('fs');

//// External modules
const express = require('express');
const bcrypt = require('bcrypt');



module.exports = (app, config, cred, db)=>{
    let RouteReloader = require( path.join(config.app.dirs.src, 'routeReloader') );
    let router = express.Router();

    // Listen to dynamic routes
    let routeReloader = new RouteReloader();
    router.use(routeReloader.handler());

    // Dynamic
    let dynamicRoutes = express.Router();
    db.Page.findAll().then( (rows)=>{

        rows.forEach((row)=>{
            console.log(row.location);
            dynamicRoutes.get(row.location, (req, res) => {
                vars = {
                    title : row.title,
                    content : row.content,
                };
                res.render('page.html', vars);
            });
        });

        routeReloader.reload(dynamicRoutes);

        // console.log('Adding route '+'/'+row.location);

    }, function(err){
        routeReloader.reload(dynamicRoutes);
        // console.log('Routes updated');
    });

    // API
    // let apiRoutes = express.Router();
    // apiRoutes.get('/api/updateRoutes', (req,res)=>{
    //     // Begin
    //     console.log('Routes updating...');
    //     let newRouter = express.Router();
    //
    //     db.each('SELECT * FROM page', function(err, row){
    //         newRouter.get(row.location, (req, res) => {
    //             vars = {
    //                 title : row.title,
    //                 content : row.content,
    //             };
    //             res.render('front/themes/twentysixteen/page.html', vars);
    //         });
    //     }, function(err, count){
    //         routeReloader.reload(newRouter);
    //         console.log(count+' routes updated');
    //         res.send(count+' routes updated');
    //     });
    // });
    // router.use(apiRoutes);

    return router;
};