//// Core modules
const path = require('path');
const fs = require('fs');

//// External modules
const nodemailer = require('nodemailer');



module.exports = (app, config, cred)=>{
    var sendmailTransporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
    });

    var smtpTransporter = nodemailer.createTransport({
        host: cred.smtp.host,
        port: config.smtp.port, // NOTE: Port 465 for secure connections
        secure: config.smtp.secure,
        auth: {
            user: cred.smtp.username,
            pass: cred.smtp.password
        }
    });
    

    return {
        sendmail: sendmailTransporter,
        smtp: smtpTransporter
    };
};