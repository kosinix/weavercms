//// Core modules
const path = require('path');
const fs = require('fs');

//// External modules
const nunjucks = require('nunjucks');

module.exports = (config, dirView)=>{

    //// Setup view
    // Setup nunjucks loader. See https://mozilla.github.io/nunjucks/api.html#loader
    let loaderFsNunjucks = new nunjucks.FileSystemLoader( [dirView], config.nunjucks.loader);

    // Setup nunjucks environment. See https://mozilla.github.io/nunjucks/api.html#environment
    return new nunjucks.Environment(loaderFsNunjucks, config.nunjucks.environment);
};