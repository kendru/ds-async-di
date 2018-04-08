const { Graph } = require('ds-deps');
const Component = require('./Component');
const syms = require('./syms');

function sequenceAsyncFns(asyncFns) {
    return asyncFns.reduce((promise, fn) =>
        promise.then(result => fn()),
        Promise.resolve());
}

function system(components) {
    const dependencies = new Graph();
    Object.keys(components).forEach(name => {
        const component = components[name];
        if (!(component instanceof Component)) {
            throw new Error(`Not a Component: ${name}`);
        }

        (component.constructor[syms.dependencies] || []).forEach(dep => {
            const dependentComponent = components[dep];
            if (!dependentComponent) {
                throw new Error(`Unmet dependency: ${dep} -> ${name}`);
            }
            
            dependencies.dependOn(name, dep);
            component[dep] = components[dep];
        });
    });
    const topoSortedDeps = dependencies.topoSort();

    // Make the system itself a component so that it can be used as a
    // subsystem in a larger system.
    class SystemComponent extends Component {

        start() {
            return sequenceAsyncFns(
                topoSortedDeps
                    .map(dep => components[dep])
                    .map(component => () => component.start()));
        }

        stop() {
            return sequenceAsyncFns(
                topoSortedDeps
                    .map(dep => components[dep])
                    .map(component => () => component.stop())
                    .reverse());
        }
    }

    return new SystemComponent();
}

module.exports = system;