//// Core modules
const path = require('path');

//// External modules

//// Modules

module.exports = (container) => {
    let config = container.get('config');

    const weaverLogger = require(path.join(config.app.dirs.src, 'weaverLogger'));

    return new weaverLogger.Logger({
        transports: [
            new weaverLogger.transports.Console(),
            // new weaverLogger.transports.File(path.join(container.get('logDir'), 'temp.log'))
        ]
    });
};