/**
 * A dead simple dependency injection container
 */
/**
Usage:

    const weaverContainer = require('/path/to/weaverContainer');

    let container = new weaverContainer.Container();

    container.set('service1', (container) => {
        return new Service1();
    });

    container.set('service2', (container) => {
        return new Service2();
    });

    // Return the SAME instance every time
    let instance1 = container.get('service1');
    let instance2 = container.get('service1');

    // Return NEW instance every time
    let instance3 = container.get('service2', false);
    let instance4 = container.get('service2', false);
 */
class Container {
    constructor(){
        this.instances = [];
        this.services = [];
    }
    set(name, fn){
        if(this.services[name] !== undefined) {
            throw new Error(util.format('Service "%s" already defined.', name));
        }
        this.services[name] = fn;
    }
    get(name, same=true){
        // `this` can be vague, make it obvious that its our container
        let container = this;

        if(this.services[name] === undefined) {

            throw new Error(util.format('Service "%s" not found.', name));
        }
        // `same` means return the same instance every time a service is called
        if(same){
            // On first call, create an instance of this service, store it and return
            if(this.instances[name] === undefined) {
                this.instances[name] = this.services[name](container);
            }
            // Succeeding calls return the same instance
            return this.instances[name];
        }
        return this.services[name](container);
    }
}

module.exports = {
    Container: Container
};