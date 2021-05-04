import * as syms from './syms';

// Ideally, we could specify interfaces, but since they do not exist at runtime, we
// would need to use a data-described interface mechanism or implement this library
// as a compile-time transform.
export type DependencyDecls<T = unknown> = Array<keyof T>;

export class Component {
  readonly [syms.type]: string = 'component';
  public static [syms.dependencies]: DependencyDecls;

  async start(): Promise<void> {
    throw new Error(`Expected ${this.constructor.name} to implement start()`);
  };

  async stop(): Promise<void> {
    throw new Error(`Expected ${this.constructor.name} to implement stop()`);
  };

  restart() {
    return this.stop().then(() => this.start());
  }
}

type ComponentConstructor<T extends Component> = {
  new (...args: any[]): T;
  [syms.dependencies]: DependencyDecls<T>;
};

export const dependsOn = <
  TComponent extends Component,
>(
  componentClass: ComponentConstructor<TComponent>,
  dependencies: DependencyDecls<TComponent>,
): ComponentConstructor<TComponent> => {
  componentClass[syms.dependencies] = dependencies;
  return componentClass;
};
