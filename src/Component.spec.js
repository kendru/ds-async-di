const { Component } = require('./Component');

class IncompleteComponent extends Component {}

test('requires a start() method', (done) => {
    const c = new IncompleteComponent();

    c.start()
        .then(() => done(new Error('expected to throw, but did not')))
        .catch(() => done());
});

test('requires a stop() method', (done) => {
    const c = new IncompleteComponent();

    c.stop()
        .then(() => done(new Error('expected to throw, but did not')))
        .catch(() => done());
});
