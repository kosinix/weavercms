//// Core modules
const fs = require('fs');
const path = require('path');

//// External modules

module.exports = (container) => {
    let filePath = container.get('configPath');

    // Read config from file
    let config = fs.readFileSync(filePath, {encoding:'utf8'});
    config = JSON.parse(config);

    // Root app dir
    config.app.dir = appDir;

    // Common app dirs
    // Use values from config.json if values aren't falsy
    config.app.dirs = {
        data: config.app.dirs.data || path.join(appDir, 'data'),
        public: config.app.dirs.public || path.join(appDir, 'data', 'public'),
        view: config.app.dirs.view || path.join(appDir, 'data', 'view'),
        src: config.app.dirs.src || path.join(appDir, 'src'),
        upload: config.app.dirs.upload || path.join(appDir, 'data', 'upload'),
    };

    // Set storage dir to data
    config.session.store.dir = config.app.dirs.data;

    return config;
};