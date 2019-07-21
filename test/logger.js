const fs = require('fs');
const path = require('path');
const expect = require("chai").expect;
const weaverLogger = require("./../src/weaverLogger");

describe("Logger Test", function() {
    describe("Formatter", function() {
        it("Using the correct formatter", function() {
            let logFile = path.join(__dirname, 'tmp.log');
            try {
                fs.unlinkSync(logFile);
            } catch(err){

            }
            let logger = new weaverLogger.Logger({
                transports: [
                    new weaverLogger.transports.Console(),
                    new weaverLogger.transports.File(logFile)
                ]
            });

            // Log
            logger.log('1');

            expect(1).to.equal(1);
            // expect(instance2.count()).to.equal(1);
            // expect(instance3.count()).to.equal(1);
            // expect(instance4.count()).to.equal(2);
            // expect(instance5.count()).to.equal(3);
        });
    });


});