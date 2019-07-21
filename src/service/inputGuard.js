//// Core modules
const path = require('path');

//// External modules
const lodash = require('lodash');

//// Modules

module.exports = (container) => {
    return {
        allowedFields: (req, allowedFields)=>{
            let defaults = {
                sanitize: (value)=>{
                    if(typeof value === "string"){
                        return lodash.trim(value);
                    } else if(typeof value === "number"){
                        return value;
                    }
                }
            };
            return lodash.mapValues(allowedFields, (currentObjValue, key, sourceObj) => {
                // Add default sanitizer. Which is just trim actually.
                currentObjValue = Object.assign(defaults, currentObjValue);
                // Use lodash.get to prevent undefined error and assign default
                let fieldValue = lodash.get(req, key, currentObjValue.default);
                return currentObjValue.sanitize(fieldValue);
            });
        }
    };
};