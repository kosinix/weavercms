let errorToArray = (err) => {
    let arr = [];
    if (err instanceof Error) {
        if(err.name==='SequelizeValidationError') {
            arr.push(err.errors.shift().message);
        } else if (err.name==='SequelizeUniqueConstraintError'){
            arr.push(err.errors.shift().message);
        } else {
            arr.push(err.message);
        }
    } else if (err instanceof Array) {
        arr = err;
    } else if (err instanceof Object) {
        arr = JSON.stringify(err);
    } else {
        arr.push('Cannot convert error.');
    }
    return arr;
};
module.exports = {
    errorToArray: errorToArray,
    // Shift first error
    errorToText: (err)=> {
        return errorToArray(err)[0];
    }
};