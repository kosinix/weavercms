//// Core modules
const path = require('path');
const http = require('http');

//// External modules

//// Modules

module.exports = (container) => {
    return {
        get: (url)=>{
            return new Promise ((resolve, reject) => {
                let req = http.get(url);

                req.on('response', res => {
                    resolve(res);
                });

                req.on('error', err => {
                    reject(new Error('Error making GET: '+err.message));
                });
            });
        }
    };
};