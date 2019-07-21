//// Core modules
const util = require('util');
const http = require('http');

//// External modules

//// Modules

module.exports = (container) => {
    let config = container.get('config');
    let cred = container.get('cred');
    let logger = container.get('logger');
    return {
        reload: ()=>{
            let endPoint = util.format('%s/api/routes/reload?key=%s', config.app.url, cred.app.secret);
            http.get(endPoint).on('error',(err)=>{
                logger.error(JSON.stringify(err));
            });
        }
    };
};