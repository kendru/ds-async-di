# ds-async-di

Dead-simple asynchronous dependency injection.

*ds-async-di* provides a simple framework for managing the lifecycle of a number
of asynchronous components that may depend on each other. It uses the dependency
tree data structure from [ds-deps](https://github.com/kendru/ds-deps) to
calculate the order in which a system of asynchronous components should be
allowed to start and stop.

This library is heavily inspired by [Stuart Sierra's](https://github.com/stuartsierra)
[component](https://github.com/stuartsierra/component) library.

### Usage

```javascript
const { Component, system } = require('ds-async-di');

class Database extends Component {
    
    // Components can be constructed with any necessary state.
    // It is common to pass configuration into a constructor.
    constructor(host, user, password) {
        this.credentials = { host, user, password };
    }

    // Every component must implement start() and stop() lifecycle methods
    // If they need to allocate or clean up resources, that work should be
    // done in these methods.
    async start() {
        console.log('Starting database');
        this.connection = await connect(this.credentials);
    }

    async stop() {
        console.log('Stopping database')
        await this.connection.release();
        delete this.connection;
    }

    // A component can have other methods, just like a normal class
    // We can rely on any resources that were created in start(), since
    // this library guarantees that this component will not be made
    // available to any other component until it has been successfully
    // started.
    async listPeople() {
        return await this.connection.query(`SELECT * from "people"`);
    }
}

class Cache extends Component {
    // ...
    // The internals of this component will look similar to Database
    // ...
}

// We can decorate a component with its dependencies. In this case, cache and
// database will always be started before the WebServer.
@Component.dependsOn([ 'cache', 'database' ])
class WebServer extends Component {
    
    async start() {
        console.log('Starting web server')
        // We can access the injected components as properties on this
        // component.
        this.handler = await startServer(this.database, this.cache);
    }

    async stop() {
        console.log('Stopping web server')
        await this.handler.shutdown();
        delete this.handler;
    }
}

const mySystem = system({
   database: new Database('localhost', 'test', 's3cr3t'),
   cache: new Cache(),
   webServer: new WebServer()
});

mySystem.start().then(() =>
  console.log('System is up and running'));
// Output:
// => Starting cache
// => Starting database
// => Starting web server
// => System is up and running

mySystem.stop().then(() =>
  console.log('System shut down'));
// Output:
// => Stopping web server
// => Stopping database
// => Stopping cache
// => System shut down
```
