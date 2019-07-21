const expect = require("chai").expect;
const weaverContainer = require("./../src/weaverContainer");

describe("Container Test", function() {
    describe("Shared services", function() {
        it("Returning the same instance vs new instance", function() {
            let container = new weaverContainer.Container();
            let globalCounter = 0;

            class Service {
                constructor(counter){
                    this.counter = counter;
                }
                count(){
                    return this.counter;
                }
            }
            container.set('service1', (container) => {
                globalCounter++;
                return new Service(globalCounter);
            });

            let instance1 = container.get('service1');
            let instance2 = container.get('service1');
            let instance3 = container.get('service1');
            let instance4 = container.get('service1', false);
            let instance5 = container.get('service1', false);

            expect(instance1.count()).to.equal(1);
            expect(instance2.count()).to.equal(1);
            expect(instance3.count()).to.equal(1);
            expect(instance4.count()).to.equal(2);
            expect(instance5.count()).to.equal(3);
        });
    });


});