//// Core modules
const path = require('path');
const util = require('util');

//// External modules

//// Modules

module.exports = (container) => {
    let config = container.get('config');

    const weaverLogger = require(path.join(config.app.dirs.src, 'weaverLogger'));

    let formatter = (message) => {
        let today = new Date();
        return util.format('Error on %s: %s %s', today.toISOString(), message, "\n");
    };

    return new weaverLogger.Logger({
        transports: [
            new weaverLogger.transports.Console({formatter: formatter}),
            // new weaverLogger.transports.File(path.join(container.get('logDir'), 'error.log'))
        ],

    });
};