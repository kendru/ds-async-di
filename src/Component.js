const syms = require('./syms')

class Component {
  
    start() {
        return Promise.reject(
            new Error(`${this.constructor.name} does not implement required method: start(): Promise<void>`)
        );
    }

    stop() {
        return Promise.reject(
            new Error(`${this.constructor.name} does not implement required method: stop(): Promise<void>`)
        );
    }

    restart() {
        return this.stop()
          .then(() => this.start());
    }
}
Component.dependsOn = function(dependencies) {
    return function decorateDependencies(component) {
        component[syms.dependencies] = dependencies;
        return component;
    }
}

module.exports = Component;
