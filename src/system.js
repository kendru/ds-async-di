const { Graph } = require('ds-deps');
const Component = require('./Component');
const syms = require('./syms');

function sequenceAsyncFns(asyncFns) {
    return asyncFns.reduce((promise, fn) =>
        promise.then(result => fn()),
        Promise.resolve());
}

function executeMethodSequentially(components, method) {
    return sequenceAsyncFns(
        components.map(component => () => component[method]()));
}

function startAllComponents(components) {
    return executeMethodSequentially(components, 'start');
}

function stopAllComponents(components) {
    return executeMethodSequentially(components, 'stop');
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
                this.startOrder
                    .map(level => () => startAllComponents(level)));
        }

        stop() {
            return sequenceAsyncFns(
                this.startOrder
                    .map(level => () => stopAllComponents(level))
                    .reverse());
        }

        get startOrder() {
            const levels = [];
            let currentLevel = [];
            for (let dep of topoSortedDeps) {
                const hasCurrentLevelDependency = currentLevel.some(cDep =>
                    dependencies.dependsOn(dep, cDep));

                if (hasCurrentLevelDependency) {
                    levels.push(currentLevel);
                    currentLevel = [];
                }

                currentLevel.push(dep);
            }
            levels.push(currentLevel);

            return levels.map(level => level.map(dep => components[dep]));
        }
    }

    return new SystemComponent();
}

module.exports = system;