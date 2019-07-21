//// Core modules
const path = require('path');

//// External modules
const nunjucks = require('nunjucks');

module.exports = (container) => {
    let config = container.get('config');
    let dirView = container.get('dirView');

    //// Setup view
    // Setup nunjucks loader. See https://mozilla.github.io/nunjucks/api.html#loader
    let loaderFsNunjucks = new nunjucks.FileSystemLoader(dirView, config.nunjucks.loader);

    // Setup nunjucks environment. See https://mozilla.github.io/nunjucks/api.html#environment
    return new nunjucks.Environment(loaderFsNunjucks, config.nunjucks.environment);
};