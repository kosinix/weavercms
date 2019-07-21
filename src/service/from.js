//// Core modules
const path = require('path');
//// External modules

//// Modules

module.exports = (container) => {
    let config = container.get('config');
    return require( path.join(config.app.dirs.src, 'from') );
};