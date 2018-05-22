require('babel-polyfill');
const { expect } = require('chai');
const system = require('./system');
const Component = require('./Component');
const sinon = require('sinon');

class TestComponent extends Component {
    constructor(events) {
        super();
        this.events = events;
    }

    async start() {
        this.events.push(`Started ${this.constructor.name}`);
    }

    async stop() {
        this.events.push(`Stopped ${this.constructor.name}`);
    }
}

class ComponentA extends TestComponent {}

@Component.dependsOn(['a'])
class ComponentB extends TestComponent {}

describe('Component systems', () => {
    let a, b;
    let events;
    let sys;

    beforeEach(() => {
        events = [];
        a = new ComponentA(events);
        b = new ComponentB(events);
        sys = system({ a, b });
    });

    it('Should create a system as a Component', () => {
        expect(sys).to.be.an.instanceOf(Component);
    });

    it('Should start up components in the correct order', async () => {
        await sys.start();

        expect(events).to.eql(['Started ComponentA', 'Started ComponentB']);
    });

    it('Should shut down components in the correct order', async () => {
        await sys.stop();

        expect(events).to.eql(['Stopped ComponentB', 'Stopped ComponentA']);
    });

    it('Should restart components in the correct order', async () => {
        await sys.start();
        events.splice(0, events.length);
        await sys.restart();

        expect(events).to.eql(['Stopped ComponentB', 'Stopped ComponentA', 'Started ComponentA', 'Started ComponentB']);
    });

    it('should make dependencies available in the depending component', async () => {
        expect(b.a).to.equal(a);
    });

    it('should start sibling components concurrently', async () => {
        class L1A extends TestComponent {}
        class L1B extends TestComponent {}

        @Component.dependsOn(['l1a'])
        class L2A extends TestComponent {}

        @Component.dependsOn(['l1b'])
        class L2B extends TestComponent {}

        @Component.dependsOn(['l1a', 'l1b'])
        class L2C extends TestComponent {}

        @Component.dependsOn(['l2a', 'l2b', 'l2c'])
        class L3A extends TestComponent {}

        const l1a = new L1A([]);
        const l1b = new L1B([]);

        const l2a = new L2A([]);
        const l2b = new L2B([]);
        const l2c = new L2C([]);

        const l3a = new L3A([]);

        const sys = system({
            l1a, l1b,
            l2a, l2b, l2c,
            l3a
        });

        const [level1, level2, level3] = sys.startOrder;
        expect(level1.sort()).to.contain.members([l1a, l1b]);
        expect(level1.length).to.equal(2);

        expect(level2.sort()).to.contain.members([l2a, l2b, l2c]);
        expect(level2.length).to.equal(3);

        expect(level3.sort()).to.contain.members([l3a]);
        expect(level3.length).to.equal(1);
    });
});
