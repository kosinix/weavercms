//// Core modules
const util = require('util');
const path = require('path');


//// Save full path of our root app directory
global.appDir = path.resolve(__dirname);


//// External modules


//// Modules
const weaverContainer = require('./src/weaverContainer');


//// Instantiate dependency injection container
const di = new weaverContainer.Container();


//// Wire dependencies

// Common
di.set('configPath', (container)=>{ return path.join(appDir, 'data', 'config.json')});
di.set('credPath', (container)=>{ return path.join(appDir, 'data', 'credentials.json')});
di.set('config', require('./src/service/config'));
di.set('session', require('./src/service/session'));
di.set('cred', require('./src/service/cred'));
di.set('logDir', (container) => { return path.join(appDir, 'data', 'logs');});
di.set('loggerError', require('./src/service/loggerError'));
di.set('loggerOk', require('./src/service/loggerOk'));
di.set('logger', require('./src/service/logger'));
di.set('nunjucksEnv', require('./src/service/nunjucksEnv'));
di.set('db', require('./src/service/db'));

// App specific
di.set('dirView', (container) => {
    let config = container.get('config');
    return [path.join(config.app.dirs.view, 'helpers'), path.join(config.app.dirs.view, 'app')]
});
di.set('routerFront', require('./src/service/app/routerFront'));
di.set('express', require('./src/service/app/front'));


//// Create our app
let config = di.get('config');
let logger = di.get('logger');
let port = config.app.port;
di.get('express').listen(port, function () {
    logger.log(util.format('App running at %s', config.app.url));
});
