const { expect } = require('chai');
const Component = require('./Component');

class IncompleteComponent extends Component {}

describe('Component', () => {

    it('Should require a start() method', (done) => {
        const c = new IncompleteComponent();

        c.start()
            .then(() => done(new Error('expected to throw, but did not')))
            .catch(() => done());
    });

    it('Should require a stop() method', (done) => {
        const c = new IncompleteComponent();

        c.stop()
            .then(() => done(new Error('expected to throw, but did not')))
            .catch(() => done());
    });
});