// Error type
class WeaverResponseError {
    constructor (err, type, status=400) {
        this.type = 'json'; // Can be html, json
        this.status = status;
        this.error = err;
        this.name = 'WeaverResponseError';
    }
    getError(){
        return this.error;
    }
}


// Export
module.exports = {
    WeaverResponseError: WeaverResponseError,
    json: (err)=>{
        return new WeaverResponseError(err, 'json');
    },
    html: (err)=>{
        return new WeaverResponseError(err, 'html');
    },
};

/*

Usage:
    // Import
    const weaverError = require('/path/to/weaverError);

    // Initialize
    const error = new weaverError.WeaverErrorJson(new Error('Error here'));


*/
