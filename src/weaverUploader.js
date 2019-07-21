//// Core modules
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

//// External modules
const Busboy = require('busboy');

//// Modules
const logger = {
    log: (...params)=>{
        console.log(...params);
    },
    error: (...params)=>{
        console.log(...params);
    }
}

// Promise API
function handleUpload(req, uploadDir, opts){
    return new Promise( (resolve, reject) => {
        handleUploadCallback(req, uploadDir, opts, (err, res)=>{
            if(err){
                return reject(err);
            }
            resolve(res);
        })
    });
}

// Classic callback API
function handleUploadCallback(req, uploadDir, opts, onFinish){
    let defaults = {
        temporaryName: (fileName)=>{
            return '__tmpweaverfile-' + crypto.randomBytes(16).toString('hex') + path.extname(fileName); // Example: '__tmpweaverfile-' + '6899f496c5fef1f35bb110e3997a2f07' + '.jpg'
        }
    }
    opts = Object.assign(defaults, opts);

    let busboy = new Busboy({ headers: req.headers });

    let origName = "";
    let temporaryName = "";
    let temporaryPath = "";
    let type = "application/octet-stream";
    let err = null;

    /**
     * NOTE: To ignore files, either remove this event handler or call fileStream.resume();
     * 
     * @param {String} fieldName Name of form file input
     * @param {FileStream} fileStream
     * @param {String} fileName The file name of the file being uploaded
     * @param {String} encoding The number of bits
     * @param {String} mimeType The mime type of the file being uploaded
     */
    busboy.on('file', (fieldName, fileStream, fileName, encoding, mimeType) =>{
        try {
            origName = fileName;
            // TODO: Dont trust fileName
            temporaryName = opts.temporaryName(fileName);
            temporaryPath = path.join(uploadDir, temporaryName);
            type = mimeType;
            logger.log(util.format('Uploading "%s" as "%s"', fileName, temporaryName, mimeType));
            
            fileStream.pipe(fs.createWriteStream(temporaryPath)); // Write file data to our stream
        } catch (err) {
            err = err;
            console.log('error catched', err);
            onFinish(
                err,
                {}
            );
        }
    });
    
    busboy.on('error', (err)=>{
        console.log('error on stream', err);
        
        onFinish(
            err,
            {}
        );
    })
    busboy.on('finish', () =>{
        onFinish(
            err,
            {
                name: origName,
                temporaryName: temporaryName,
                path: temporaryPath,
                mimeType: type
            }
        );
    });
    req.pipe(busboy);
}

// TODO: refactoring and make usable
// function handleChunking(req, res, fnOk, fnError){

//     let busboy = new Busboy({ headers: req.headers }); // TODO: Handle errors

//     // Hold upload this request's state
//     // NOTE: This is built on the assumption that Plupload send chunks in SEQUENTIAL order. Otherwise this wont work.
//     let serverUploadPath = path.join(appDir, 'data', 'uploads');

//     let clientUid = ''; // Unique file identifier from client
//     let clientOrigName = ''; // Original name of uploaded file
//     let serverTmpName = ''; // Temporary name on the server while it is still uploading
//     let serverTmpPath = ''; // Temporary path

//     let serverFinalName = ''; // Final name on the server
//     let serverFinalPath = ''; // Complete path to uploaded file


//     let chunks = 1;
//     let chunk = 0;

//     logger.log('Start of upload');

//     // Busboy works on field first
//     busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
//         // console.log('Field [' + fieldname + ']: value: ' + inspect(val));

//         if(fieldname==='chunk'){
//             chunk = parseInt(val); // Important: should be treated as number not string
//         }
//         if(fieldname==='chunks'){
//             chunks = parseInt(val); // Important: should be treated as number not string
//         }

//         // Store state
//         if(fieldname==='name'){
//             clientUid = val;

//         }

//         if(fieldname==='origName'){
//             clientOrigName = val;

//             serverTmpName = '__tmpweaverfile-' + clientUid + path.extname(clientOrigName); // Example: '__tmpweaverfile-' + 'o_1brnpll4d16jlge2412eqm12imb' + '.jpg'
//             serverTmpPath = path.join(serverUploadPath, serverTmpName);
//         }

//     });

//     // Next busboy works on file
//     busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

//         logger.log(util.format('Chunk %d of %d', chunk+1, chunks ));
//         let writeStream = '';
//         // We re-build chunks by simply appending data to the file (uploaded file).
//         // However, if a file exists on the same path, appending data to it would result in a corrupted file.
//         // To prevent this, use write+truncate mode on the first chunk (chunk 0). This will replace an existing file on the same path.
//         // Otherwise on succeeding chunks, use append mode.
//         if(chunk===0){
//             // On first chunk, open stream in write+truncate mode.
//             // This works on a single continuous file too (a file with 1 chunk only).
//             writeStream = fs.createWriteStream(serverTmpPath, {flags:'w'});
//             logger.log(util.format('Open stream "%s" in write+truncate mode', serverTmpPath ));
//         } else {
//             // On succeeding chunks of the same file, use append mode.
//             // This is not executed on files with 1 chunk only
//             logger.log(util.format('Open stream "%s" in append mode', serverTmpPath ));
//             writeStream = fs.createWriteStream(serverTmpPath, {flags:'a'});
//         }
//         file.on('data', function(data) {
//             // logger.log(util.format('File [%s] got %d bytes', fieldname, data.length ));
//         });
//         file.on('end', function() {
//             logger.log(util.format('File [%s] Finished', fieldname));
//         });
//         logger.log(util.format('File [%s]: filename: %s, encoding: %s, mimetype: %s', fieldname, filename, encoding, mimetype));

//         file.pipe(writeStream); // Write file data to our stream

//     });

//     // Busboy is done
//     // Send useful info to client
//     busboy.on('finish', function() {

//         if(chunk < chunks-1){
//             let result = {
//                 status:'file chunk processed',
//                 origName: clientOrigName,
//                 chunk: chunk,
//                 chunks: chunks,
//                 tmpPath: serverTmpPath,
//                 finalPath: serverFinalPath
//             };

//             logger.log('End of upload');

//             res.status(200).send(JSON.stringify(result));
//         } else { // Final chunk
//             logger.log('Finalizing upload...');

//             serverFinalName = crypto.randomBytes(16).toString('hex') + path.extname(clientOrigName); // Rename into a random string + original file extension
//             serverFinalPath = path.join(serverUploadPath, serverFinalName);

//             fs.rename(serverTmpPath, serverFinalPath, function(err){
//                 if(err){
//                     logger.error('End of upload but with error', err);

//                     fnError(req, res, err);

//                     return;
//                 }
//                 logger.log(util.format('Renamed %s to %s', serverTmpPath, serverFinalPath));

//                 let result = {
//                     status:'file complete',
//                     origName: clientOrigName,
//                     chunk: chunk,
//                     chunks: chunks,
//                     tmpPath: serverTmpPath,
//                     finalName: serverFinalName,
//                     finalPath: serverFinalPath
//                 };

//                 logger.log('End of upload');
//                 fnOk(result, req, res);

//             });

//         }


//     });
//     req.pipe(busboy);

// }

module.exports = {
    handleUpload: handleUpload,    
    handleUploadCallback: handleUploadCallback
}

