//// Core modules

//// External modules

//// Modules

module.exports = (container) => {
    //// Wrap logger in to nicer API
    return {
        log: (message) => {
            container.get('loggerOk').log(message);
        },
        error: (message) => {
            container.get('loggerError').log(message);
        }
    };
};