//// Core modules
const path = require('path');

//// External modules
const validator = require('validator');

//// Modules

module.exports = (container) => {
    return {
        // For `name`, see https://github.com/chriso/validator.js for list of validator names.
        validate: (name, message, ...params)=>{
            let result = validator[name](...params);
            if(false === result){
                throw new Error(message);
            }
        },
        isEqual: (expected, actual, message)=>{
            if(expected!==actual){
                throw new Error(message);
            }
        },
        isTrue: (param, message)=>{
            if(!param){
                throw new Error(message);
            }
        }
    };
};