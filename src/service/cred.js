//// Core modules
const fs = require('fs');

//// External modules

module.exports = (container) => {
    let filePath = container.get('credPath');

    // Read config from file
    let cred = fs.readFileSync(filePath, {encoding:'utf8'});
    return JSON.parse(cred);
};