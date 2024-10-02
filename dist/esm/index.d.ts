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
    /** Interval between connection attempts */
    connectInterval?: number;
    /** Every connection attempt the interval increasing at options.connectInterval till max this number */
    connectMaxAttempt?: number;
}
export type SocketEventHandler = (...args: any[]) => void;
export type SocketConnectionHandler = (connected: boolean) => void;
export type SocketDisconnectionHandler = () => void;
export type SocketErrorHandler = (err: string) => void;
export declare class SocketClient {
    private readonly connectHandlers;
    private readonly reconnectHandlers;
    private readonly disconnectHandlers;
    private readonly errorHandlers;
    private readonly handlers;
    private wasConnected;
    private connectTimer;
    private connectingTimer;
    private connectionCount;
    private callbacks;
    private pending;
    private id;
    private lastPong;
    private socket;
    private url;
    private options;
    private pingInterval;
    private sessionID;
    private authTimeout;
    connected: boolean;
    private readonly log;
    constructor();
    private static getQuery;
    connect(url?: string, options?: ConnectOptions): SocketClient;
    private _garbageCollect;
    private withCallback;
    private findAnswer;
    emit: (name: string, ...args: any[]) => void;
    on(name: string, cb: SocketEventHandler | SocketErrorHandler | SocketDisconnectionHandler | SocketConnectionHandler): void;
    off(name: string, cb: SocketEventHandler | SocketErrorHandler | SocketDisconnectionHandler | SocketConnectionHandler): void;
    close(): SocketClient;
    disconnect: () => SocketClient;
    destroy(): void;
    private _reconnect;
}
export declare function connect(url?: string, options?: ConnectOptions): SocketClient;
declare global {
    interface Window {
        io: {
            connect: (url?: string, options?: ConnectOptions) => SocketClient;
        };
    }
}
