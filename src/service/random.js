//// Core modules
const crypto = require('crypto');

//// External modules

//// Modules

module.exports = (container) => {
    return {
        string: (length=32)=>{
            return crypto.randomBytes(length/2).toString('hex')
        }
    };
};