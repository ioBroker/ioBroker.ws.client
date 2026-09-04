/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
/* jshint expr: true */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BUILD = path.join(__dirname, '..', 'build', 'cjs', 'socket.io.js');

/**
 * Load the built client into a sandbox and return the url it hands to the WebSocket constructor.
 * The socket is never opened, only the url that connect() assembles is of interest here.
 *
 * @param {string} url url passed to io.connect()
 * @param {object} [options] options passed to io.connect()
 * @returns {string} url the client would have opened
 */
function connectUrl(url, options) {
    let captured = null;

    function FakeWebSocket(u) {
        captured = u;
        this.readyState = 0;
        this.send = () => {};
        this.close = () => {};
    }

    const context = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        WebSocket: FakeWebSocket,
        Date,
        JSON,
        parseInt,
        Object,
        Error,
        String,
        Uint8Array,
        location: { protocol: 'http:', host: 'localhost', pathname: '/', href: 'http://localhost/' },
        module: { exports: {} },
        exports: {},
    };
    context.window = context;
    context.globalThis = context;
    context.self = context;

    vm.createContext(context);
    vm.runInContext(fs.readFileSync(BUILD, 'utf8'), context, { timeout: 5000 });

    const client = context.io.connect(url, options || {});
    client.destroy();

    return captured;
}

describe('connect url', () => {
    it('keeps plain query values as they are', () => {
        const url = connectUrl('ws://localhost/?user=admin&pass=secret');

        assert.ok(url.includes('user=admin'), url);
        assert.ok(url.includes('pass=secret'), url);
    });

    it('encodes query values, so they survive the round trip', () => {
        // getQuery() decodes the values, therefore they have to be encoded again on the way out -
        // the server reads them with decodeURIComponent()
        const url = connectUrl('ws://localhost/?user=a%20b&pass=p%26q');

        assert.ok(url.includes(`user=${encodeURIComponent('a b')}`), url);
        assert.ok(url.includes(`pass=${encodeURIComponent('p&q')}`), url);
    });

    it('encodes the name and the token', () => {
        const url = connectUrl('ws://localhost/', { name: 'my client', token: 'a b+c' });

        assert.ok(url.includes(`name=${encodeURIComponent('my client')}`), url);
        assert.ok(url.includes(`token=${encodeURIComponent('a b+c')}`), url);
    });

    it('always carries a session id', () => {
        assert.match(connectUrl('ws://localhost/'), /[?&]sid=\d+/);
    });
});
