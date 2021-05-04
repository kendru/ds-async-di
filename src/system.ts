import { Graph } from 'ds-deps';
import { Component } from './Component';
import * as syms from './syms';

const sequenceAsyncFns = <TFn extends () => Promise<void>>(asyncFns: TFn[]): Promise<void> => {
    return asyncFns.reduce((promise, fn) =>
        promise.then(_result => fn()),
        Promise.resolve());
}

const executeMethodSequentially = (components: Component[], method: 'start' | 'stop'): Promise<void> => {
    return sequenceAsyncFns(
        components.map(component => () => component[method]()));
}

const startAllComponents = (components: Component[]) => executeMethodSequentially(components, 'start');
const stopAllComponents = (components: Component[]) => executeMethodSequentially(components, 'stop');

type ComponentMapping = { [key: string]: Component };

export interface System extends Component {
  readonly components: ComponentMapping;
  readonly startOrder: Component[][];
}

export const system = (components: ComponentMapping): System => {
    const dependencies = new Graph<string>();
    Object.keys(components).forEach(name => {
        const component = components[name];
        if (!(component instanceof Component) && component[syms.type] !== 'component') {
            throw new Error(`Not a Component: ${name}`);
        }

        const klass = (component.constructor as typeof Component);
        const deps = klass[syms.dependencies] || [];
        (deps).forEach((dep: string) => {
            const dependentComponent = components[dep];
            if (!dependentComponent) {
                throw new Error(`Unmet dependency: ${dep} -> ${name}`);
            }

            dependencies.dependOn(name, dep);
            (component as any)[dep] = components[dep];
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

        get components() {
            return components;
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

