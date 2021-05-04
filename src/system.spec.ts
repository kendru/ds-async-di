import { system, System } from './system';
import { Component, dependsOn } from './component';

class TestComponent extends Component {
  constructor(public events: string[]) {
    super();
  }

  async start() {
    this.events.push(`Started ${this.constructor.name}`);
  }

  async stop() {
    this.events.push(`Stopped ${this.constructor.name}`);
  }
}

class ComponentA extends TestComponent {}

class ComponentB extends TestComponent {
  public a?: ComponentA;
}
const InjectedComponentB = dependsOn(ComponentB, ['a']);

let a: ComponentA;
let b: ComponentB;
let events: string[];
let sys: System;

beforeEach(() => {
  events = [];
  a = new ComponentA(events);
  b = new InjectedComponentB(events);
  sys = system({ a, b });
});

test('Should create a system as a Component', () => {
  expect(sys).toBeInstanceOf(Component);
});

test('should expose the components', () => {
  expect(sys.components.a).toEqual(a);
  expect(sys.components.b).toEqual(b);
});

test('Should start up components in the correct order', async () => {
  await sys.start();

  expect(events).toEqual(['Started ComponentA', 'Started ComponentB']);
});

test('Should shut down components in the correct order', async () => {
  await sys.stop();

  expect(events).toEqual(['Stopped ComponentB', 'Stopped ComponentA']);
});

test('Should restart components in the correct order', async () => {
  await sys.start();
  events.splice(0, events.length);
  await sys.restart();

  expect(events).toEqual([
    'Stopped ComponentB',
    'Stopped ComponentA',
    'Started ComponentA',
    'Started ComponentB',
  ]);
});

test('should make dependencies available in the depending component', async () => {
  expect(b.a).toEqual(a);
});

test('should start sibling components concurrently', async () => {
  class L1A extends TestComponent {}
  class L1B extends TestComponent {}

  class L2A extends TestComponent {
    public l1a?: L1A;
  }
  const InjectedL2A = dependsOn(L2A, ['l1a']);

  class L2B extends TestComponent {
    public l1b?: L1B;
  }
  const InjectedL2B = dependsOn(L2B, ['l1b']);

  class L2C extends TestComponent {
    public l1a?: L1A;
    public l1b?: L1B;
  }
  const InjectedL2C = dependsOn(L2C, ['l1a', 'l1b']);

  class L3A extends TestComponent {
    public l2a?: L2A;
    public l2b?: L2B;
    public l2c?: L2C;
  }
  const InjectedL3A = dependsOn(L3A, ['l2a', 'l2b', 'l2c']);

  const l1a = new L1A([]);
  const l1b = new L1B([]);

  const l2a = new InjectedL2A([]);
  const l2b = new InjectedL2B([]);
  const l2c = new InjectedL2C([]);

  const l3a = new InjectedL3A([]);

  const sys = system({
    l1a,
    l1b,
    l2a,
    l2b,
    l2c,
    l3a,
  });

  const [level1, level2, level3] = sys.startOrder;
  expect(new Set(level1)).toEqual(new Set([l1a, l1b]));
  expect(new Set(level2)).toEqual(new Set([l2a, l2b, l2c]));
  expect(level3).toEqual([l3a]);
});
