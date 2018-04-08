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
});
