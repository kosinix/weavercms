//// Core modules
const path = require('path');
const fs = require('fs');

//// External modules
const Sequelize = require('sequelize');

module.exports = (app, config, db)=>{

    const User = sequelize.define('user', {
        username: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        remember: {
            type: Sequelize.STRING
        }
    }, {timestamps: false});

    const Page = sequelize.define('page', {
        title: {
            type: Sequelize.STRING
        },
        location: {
            type: Sequelize.STRING
        },
        content: {
            type: Sequelize.STRING
        },
        created: {
            type: Sequelize.STRING
        }
    }, {timestamps: false});



    return {
        User: User
    };
};