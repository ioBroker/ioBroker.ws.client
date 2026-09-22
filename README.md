# ioBroker.ws.client - @iobroker/ws

This library is used for communication with the back-end via pure web-sockets.

It simulates `socket.io` interface.

It is used normally together with `@iobroker/ws-server` on server side, and it is not compatible with `socket.io` (server) library.

## Usage

In the same way as `socket.io.client` library

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 3.1.2 (2026-09-22)
-   (@GermanBluefox) Called the callbacks that still wait for an answer with `'disconnected'` when the connection is closed, before they were never called

### 3.1.1 (2026-09-06)
-   (@joltcoke) Encoded the query values when the connection URL is assembled, so a value with `&`, `=`, `+`, `%` or a space reaches the server unchanged
-   (@GermanBluefox) Encoded the query attribute names too, they were sent twice encoded
-   (@GermanBluefox) Read `+` in the query as a space again, like the server does
-   (@GermanBluefox) Interpreted an attribute without a value as `true`: `?a=b&c&d=6` sends `c=true`. An empty value, like `?c=`, stays empty
-   (@GermanBluefox) Stopped cutting a value at the second `=`, so `?pass=a=b` keeps its whole value
-   (@GermanBluefox) Kept the connection alive if the URL contains a malformed percent sequence
-   (@GermanBluefox) Sent the connection name only once if the URL already brings one
-   (@GermanBluefox) Added tests for the connection URL and enabled them in the CI

### 3.1.0 (2026-04-13)
-   (@GermanBluefox) Fixed possible errors

### 3.0.5 (2026-02-25)

-   (@GermanBluefox) Updated packages

### 3.0.4 (2025-10-25)

-   (@GermanBluefox) Updated packages

### 3.0.3 (2025-06-21)

-   (@GermanBluefox) Allowed to use the code in node.js too

### 2.1.0 (2025-03-05)

-   (@GermanBluefox) Fixed lint warnings
-   (@GermanBluefox) Used TypeScript 5.8

### 2.0.2 (2025-02-24)

-   (@GermanBluefox) Added support for OAuth2 authentication

### 2.0.0 (2024-10-02)

-   (@GermanBluefox) Code was rewritten with TypeScript

### 1.1.2 (2022-08-18)

-   (@GermanBluefox) improved `writeFile` call

### 1.1.1 (2022-05-22)

-   (@GermanBluefox) Cosmetic change done

### 1.1.0 (2022-02-21)

-   (@GermanBluefox) Made it possible to have more than one socket from one page

### 1.0.4 (2022-02-13)

-   (@GermanBluefox) Added disconnect for back compatibility

### 1.0.3 (2022-02-02)

-   (@GermanBluefox) Fixed error if URL contains #

### 1.0.2 (2022-01-30)

-   (@GermanBluefox) initial commit

## License

The MIT License (MIT)

Copyright (c) 2020-2026 @GermanBluefox <dogafox@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
