/*!
 * ioBroker WebSockets
 * Copyright 2020-2024, bluefox <dogafox@gmail.com>
 * Released under the MIT License.
 * v 1.1.3 (2024_10_02)
 */
export interface ConnectOptions {
    /** Connection name, so the backend knows who wants to connect. Optional */
    name?: string;
    /** Timeout for answer for ping (pong) */
    pongTimeout?: number;
    /** Ping interval */
    pingInterval?: number;
    /** connection request timeout */
    connectTimeout?: number;
    /** Authentication timeout */
    authTimeout?: number;
    /**
     * How long an emit with a callback waits for its answer, in milliseconds. Default 30000.
     *
     * After this the callback is called with the string `'timeout'` and a late answer is dropped.
     * Raise it for commands that are allowed to take their time - `sendTo` to an adapter that
     * queries a slow remote service, for instance - and keep in mind that it applies to every
     * callback of this connection.
     */
    callbackTimeout?: number;
    /** Interval between connection attempts */
    connectInterval?: number;
    /** Every connection attempt the interval increasing at options.connectInterval till max this number */
    connectMaxAttempt?: number;
    /** Token for authentication */
    token?: string;
    /** WebSocket constructor, if you want to use a custom one */
    WebSocket?: any;
}
export type SocketEventHandler = (...args: any[]) => void;
export type SocketConnectionHandler = (connected: boolean) => void;
export type SocketDisconnectionHandler = () => void;
export type SocketErrorHandler = (err: string) => void;
export declare class SocketClient {
    connected: boolean;
    constructor();
    connect(url?: string, options?: ConnectOptions): SocketClient;
    emit: (name: string, ...args: any[]) => void;
    on(
        name: string,
        cb: SocketEventHandler | SocketErrorHandler | SocketDisconnectionHandler | SocketConnectionHandler,
    ): void;
    off(
        name: string,
        cb: SocketEventHandler | SocketErrorHandler | SocketDisconnectionHandler | SocketConnectionHandler,
    ): void;
    close(): SocketClient;
    disconnect: () => SocketClient;
    destroy(): void;
}
export declare function connect(url?: string, options?: ConnectOptions): SocketClient;
declare global {
    interface Window {
        io: {
            connect: (url?: string, options?: ConnectOptions) => SocketClient;
        };
    }
}
