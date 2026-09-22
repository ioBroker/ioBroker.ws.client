/**
 * Tests for the url that connect() assembles.
 *
 * getQuery() decodes the query of the given url, so connect() has to encode it again on the
 * way out. The server parses the query with querystring.parse(), i.e. as
 * application/x-www-form-urlencoded, and these tests pin down that round trip.
 */
'use strict';

const assert = require('node:assert');

const { loadClient, connectUrl, serverQuery, connectQuery } = require('./lib/client');

describe('connect url - base url', () => {
    it('turns http into ws and keeps the path', () => {
        const url = connectUrl('http://example.com:8081/socket');

        assert.match(url, /^ws:\/\/example\.com:8081\/socket\?/, url);
    });

    it('turns https into wss', () => {
        const url = connectUrl('https://example.com/socket');

        assert.match(url, /^wss:\/\/example\.com\/socket\?/, url);
    });

    it('keeps a ws url as it is', () => {
        const url = connectUrl('ws://example.com/socket');

        assert.match(url, /^ws:\/\/example\.com\/socket\?/, url);
    });

    it('drops the hash', () => {
        const url = connectUrl('ws://example.com/socket?user=admin#section');

        assert.ok(!url.includes('#'), url);
        assert.deepStrictEqual(connectQuery('ws://example.com/socket?user=admin#section'), { user: 'admin' });
    });

    it('drops the old query from the path', () => {
        const url = connectUrl('ws://example.com/socket?user=admin');

        assert.strictEqual(url.split('?')[0], 'ws://example.com/socket');
    });

    it('falls back to location.href', () => {
        const url = connectUrl(undefined, {}, { href: 'http://example.com:8082/panel?user=admin' });

        assert.match(url, /^ws:\/\/example\.com:8082\/panel\?/, url);
        assert.deepStrictEqual(connectQuery(undefined, {}, { href: 'http://example.com:8082/panel?user=admin' }), {
            user: 'admin',
        });
    });

    it('builds the url from location when "/" is given', () => {
        const url = connectUrl('/', {}, { protocol: 'https:', host: 'example.com', pathname: '/admin/index.html' });

        assert.match(url, /^wss:\/\/example\.com\//, url);
        assert.ok(!url.includes('index.html'), url);
    });

    it('removes a file name ending with .htm, too', () => {
        const url = connectUrl('/', {}, { protocol: 'http:', host: 'example.com', pathname: '/vis/edit.htm' });

        assert.strictEqual(url.split('?')[0], 'ws://example.com/vis');
    });

    it('keeps the path of the location when it has no file name', () => {
        const url = connectUrl('/', {}, { protocol: 'http:', host: 'example.com:8082', pathname: '/vis/' });

        assert.strictEqual(url.split('?')[0], 'ws://example.com:8082/vis/');
    });

    it('falls back to ws: and localhost when the location has no protocol and no host', () => {
        const url = connectUrl('/', {}, { protocol: '', host: '', pathname: '/' });

        assert.strictEqual(url.split('?')[0], 'ws://localhost/');
    });
});

describe('connect url - session id', () => {
    it('always carries a session id', () => {
        assert.match(connectUrl('ws://localhost/'), /\?sid=\d+/);
    });

    it('uses a fresh timestamp as session id', () => {
        const before = Date.now();
        const sid = parseInt(serverQuery(connectUrl('ws://localhost/')).sid, 10);
        const after = Date.now();

        assert.ok(sid >= before && sid <= after, `${sid} is not between ${before} and ${after}`);
    });

    it('never reuses a session id from the given url', () => {
        const query = serverQuery(connectUrl('ws://localhost/?sid=42&user=admin'));

        assert.notStrictEqual(query.sid, '42');
        assert.strictEqual(typeof query.sid, 'string', 'the sid must not appear twice');
        assert.strictEqual(query.user, 'admin');
    });

    it('also replaces a session id given without a value', () => {
        const query = serverQuery(connectUrl('ws://localhost/?sid&user=admin'));

        assert.strictEqual(typeof query.sid, 'string', 'the sid must not appear twice');
        assert.match(query.sid, /^\d+$/);
    });
});

describe('connect url - query round trip', () => {
    // [description, query of the given url, what the server has to receive]
    const CASES = [
        ['plain values', 'user=admin&pass=secret', { user: 'admin', pass: 'secret' }],
        ['a space written as %20', 'user=a%20b', { user: 'a b' }],
        ['a space written as +', 'user=a+b', { user: 'a b' }],
        ['a literal plus', 'user=a%2Bb', { user: 'a+b' }],
        ['an ampersand', 'pass=p%26q', { pass: 'p&q' }],
        ['an encoded equals sign', 'pass=a%3Db', { pass: 'a=b' }],
        ['an unencoded equals sign', 'pass=a=b', { pass: 'a=b' }],
        ['a percent sign', 'pass=100%25', { pass: '100%' }],
        ['a question mark', 'pass=a%3Fb', { pass: 'a?b' }],
        ['a hash inside a value', 'pass=a%23b', { pass: 'a#b' }],
        ['an url as value', 'redirect=http%3A%2F%2Fa.b%2Fc%3Fd%3D1', { redirect: 'http://a.b/c?d=1' }],
        ['non ascii characters', 'user=%C3%BCser&pass=%E2%82%AC5', { user: 'üser', pass: '€5' }],
        ['an encoded attribute name', 'my%20key=1', { 'my key': '1' }],
        ['an attribute name with an ampersand', 'a%26b=1', { 'a&b': '1' }],
        ['several attributes at once', 'a=1&b=2&c=3', { a: '1', b: '2', c: '3' }],
    ];

    for (const [description, query, expected] of CASES) {
        it(`survives ${description}`, () => {
            assert.deepStrictEqual(connectQuery(`ws://localhost/?${query}`), expected);
        });
    }

    it('does not encode twice when the same client reconnects', () => {
        const { io, urls } = loadClient();
        const client = io.connect('ws://localhost/?user=a%20b&pass=p%26q', {});

        client.close();
        client.connect();
        client.destroy();

        assert.ok(urls.length > 1, 'the client did not reconnect');
        for (const url of urls) {
            const query = serverQuery(url);
            assert.strictEqual(query.user, 'a b', url);
            assert.strictEqual(query.pass, 'p&q', url);
        }
    });

    it('keeps the name and the token when the same client reconnects', () => {
        const { io, urls } = loadClient();
        const client = io.connect('ws://localhost/?user=admin', { name: 'my client', token: 'a b' });

        client.close();
        client.connect();
        client.destroy();

        assert.ok(urls.length > 1, 'the client did not reconnect');
        for (const url of urls) {
            const query = serverQuery(url);
            delete query.sid;
            assert.deepStrictEqual(query, { user: 'admin', name: 'my client', token: 'a b' }, url);
        }
    });

    it('assembles a url that needs no repair by the url parser', () => {
        for (const [, query] of CASES) {
            const url = connectUrl(`ws://localhost/?${query}`);

            assert.doesNotThrow(() => new URL(url), url);
            assert.ok(!/[ <>"`{}|\\^]/.test(url), `${url} contains a character that is invalid in an url`);
        }
    });
});

describe('connect url - flags and empty values', () => {
    it('reads an attribute without a value as true', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?a=b&c&d=6'), { a: 'b', c: 'true', d: '6' });
    });

    it('reads a flag as true no matter where it stands', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?flag&user=admin'), { flag: 'true', user: 'admin' });
        assert.deepStrictEqual(connectQuery('ws://localhost/?user=admin&flag'), { user: 'admin', flag: 'true' });
        assert.deepStrictEqual(connectQuery('ws://localhost/?flag'), { flag: 'true' });
    });

    it('keeps an empty value empty and does not turn it into a flag', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?pass=&user=admin'), { pass: '', user: 'admin' });
    });

    it('tells a flag apart from an empty value', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?a&b='), { a: 'true', b: '' });
    });

    it('keeps a value that is literally "true"', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?a=true&b=false'), { a: 'true', b: 'false' });
    });

    it('encodes a flag name with special characters', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?a%20b'), { 'a b': 'true' });
    });

    it('ignores an empty query', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?'), {});
    });

    it('ignores empty separators', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?&&user=admin&&'), { user: 'admin' });
    });

    it('works without a query at all', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/'), {});
    });
});

describe('connect url - name option', () => {
    it('adds the name', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/', { name: 'my client' }), { name: 'my client' });
    });

    it('encodes a name with special characters', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/', { name: 'a&b=c+d' }), { name: 'a&b=c+d' });
    });

    it('leaves a name from the url alone', () => {
        const query = connectQuery('ws://localhost/?name=fromUrl', { name: 'fromOptions' });

        assert.deepStrictEqual(query, { name: 'fromUrl' });
    });

    it('does not add the name twice when the url brings an empty one', () => {
        const query = connectQuery('ws://localhost/?name=', { name: 'fromOptions' });

        assert.strictEqual(typeof query.name, 'string', 'the name must not appear twice');
        assert.strictEqual(query.name, '');
    });

    it('does not add the name twice when the url brings it as a flag', () => {
        const query = connectQuery('ws://localhost/?name', { name: 'fromOptions' });

        assert.deepStrictEqual(query, { name: 'true' }, 'the name must not appear twice');
    });

    it('adds no name when none is given', () => {
        assert.ok(!('name' in connectQuery('ws://localhost/?user=admin')));
    });
});

describe('connect url - token option', () => {
    it('adds the token', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/', { token: 'abc123' }), { token: 'abc123' });
    });

    it('encodes a token with a space and a plus', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/', { token: 'a b+c' }), { token: 'a b+c' });
    });

    it('encodes a token with an ampersand and an equals sign', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/', { token: 'x&y=z' }), { token: 'x&y=z' });
    });

    it('adds no token when none is given', () => {
        assert.ok(!('token' in connectQuery('ws://localhost/?user=admin')));
    });

    it('keeps the token next to the other attributes', () => {
        assert.deepStrictEqual(connectQuery('ws://localhost/?user=a%20b', { name: 'c d', token: 'e f' }), {
            user: 'a b',
            name: 'c d',
            token: 'e f',
        });
    });
});

describe('connect url - robustness', () => {
    it('does not throw on a malformed percent sequence', () => {
        let url;
        assert.doesNotThrow(() => (url = connectUrl('ws://localhost/?pass=%E0%A4%A&user=admin')));
        assert.strictEqual(serverQuery(url).user, 'admin', url);
    });

    it('reports a failing WebSocket constructor instead of throwing', () => {
        const { io } = loadClient();

        function ThrowingWebSocket() {
            throw new Error('no connection');
        }

        let client;
        assert.doesNotThrow(() => {
            client = io.connect('ws://localhost/', { WebSocket: ThrowingWebSocket });
        });
        assert.strictEqual(client.connected, false);
        client.destroy();
    });
});
