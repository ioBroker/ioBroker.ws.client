/**
 * Test helper: run the built client in a sandbox and look at the url it would open.
 *
 * The client has no CommonJS export, it assigns itself to `globalThis.io`, so it is
 * loaded into a vm context. The WebSocket is replaced by a stub that only records the
 * url - no connection is ever opened.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const querystring = require('node:querystring');
const vm = require('node:vm');

const BUILD = path.join(__dirname, '..', '..', 'build', 'cjs', 'socket.io.js');

const DEFAULT_LOCATION = {
    protocol: 'http:',
    host: 'localhost:8081',
    hostname: 'localhost',
    pathname: '/',
    href: 'http://localhost:8081/',
    reload: () => {},
};

/**
 * Load the built client into a fresh sandbox.
 *
 * @param {object} [location] location object the client should see
 * @returns {{io: object, urls: string[]}} sandbox handle
 */
function loadClient(location) {
    const urls = [];

    function FakeWebSocket(url) {
        urls.push(url);
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
        location: { ...DEFAULT_LOCATION, ...(location || {}) },
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync(BUILD, 'utf8'), context, { timeout: 5000 });

    return { io: context.io, urls };
}

/**
 * Assemble a connection url the way connect() does and return it.
 *
 * @param {string} url url passed to io.connect()
 * @param {object} [options] options passed to io.connect()
 * @param {object} [location] location object the client should see
 * @returns {string} url the client handed to the WebSocket constructor
 */
function connectUrl(url, options, location) {
    const { io, urls } = loadClient(location);
    const client = io.connect(url, options || {});
    client.destroy();

    if (!urls.length) {
        throw new Error('The client did not try to open a connection');
    }

    return urls[urls.length - 1];
}

/**
 * The query as the server sees it.
 *
 * A browser normalizes the url before it goes on the wire, and the ws-server parses
 * the query with querystring.parse(), so this is the value that really arrives in the
 * adapter. Assert against this whenever the point of a test is the transported value.
 *
 * @param {string} url url the client would have opened
 * @returns {object} parsed query
 */
function serverQuery(url) {
    // spread it into a normal object, querystring.parse() returns one without a prototype
    return { ...querystring.parse(new URL(url).search.slice(1)) };
}

/**
 * Shortcut: connect and return the query the server would receive, without the sid.
 *
 * @param {string} url url passed to io.connect()
 * @param {object} [options] options passed to io.connect()
 * @param {object} [location] location object the client should see
 * @returns {object} parsed query without the sid
 */
function connectQuery(url, options, location) {
    const query = serverQuery(connectUrl(url, options, location));
    delete query.sid;
    return query;
}

module.exports = { loadClient, connectUrl, serverQuery, connectQuery };
