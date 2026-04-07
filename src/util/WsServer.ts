import { WebSocket } from 'vite';
import { WebSocketServer } from 'ws';
import { isPortInUse } from './isPortInUse.ts';

interface WsServerBroadcastMessage {
	action: string,
	data: { script: string, uri: string }
}


export class WsServer {
	/**
	 * 已经链接到 ws 的客户端
	 */
	private clients: Set<WebSocket> = new Set();
	
	/**
	 * ws 服务器
	 */
	private wss: WebSocketServer | null = null;
	
	
	constructor( private port: number = 8642 ) {}
	
	private cacheScripts: Map<string, string> = new Map();
	
	/**
	 * 在 ws 客户端未连接的情况下缓存脚本推送
	 */
	cacheScript( script: string, uri: string ) {
		this.cacheScripts.set( uri, script );
		console.info( `[ScriptCat] cache script:`, uri );
	}
	
	/**
	 * 广播
	 */
	broadcast( message: WsServerBroadcastMessage ) {
		const msg = JSON.stringify( message );
		let index = 0;
		this.clients.forEach( ( client ) => {
			if ( client.readyState === client.OPEN ) {
				client.send( msg );
				console.info( `[ScriptCat] broadcast to client-${ ++index }:`, message.data.uri );
			}
		} );
	}
	
	/**
	 * 广播脚本内容
	 */
	broadcastScript( script: string, uri: string ) {
		this.broadcast( { action: 'onchange', data: { script, uri } } );
	}
	
	/**
	 * 创建 ws 服务器
	 */
	create() {
		try {
			this.wss = new WebSocketServer( { port: this.port } );
			
			this.wss.on( 'connection', ( ws ) => {
				this.clients.add( ws );
				console.info( `[ScriptCat] client-${ this.clients.size } connected` );
				
				// 广播所有缓存脚本内容
				this.cacheScripts.forEach( ( script, uri ) => {
					this.broadcastScript( script, uri );
				} );
				
				ws.on( 'close', () => this.clients.delete( ws ) );
				ws.on( 'error', console.error );
			} );
			
			console.log( `[ScriptCat] WS server started on port ${ this.port }` );
			
			setInterval( () => {
				if ( this.hasServer() ) {
					this.clients.forEach( ws => {
						ws.ping();
					} );
				}
			}, 30_000 );
		}
		catch ( error ) {
			console.warn( `\x1b[33m[ScriptCat] Port ${ this.port } unavailable\x1b[0m` );
		}
	}
	
	/**
	 * 检查端口是否被占用
	 */
	async isPortInUse(): Promise<boolean> {
		return await isPortInUse( this.port );
	}
	
	/**
	 * 检查是否存在 ws 服务器
	 */
	hasServer(): boolean {
		return Boolean( this.wss );
	}
	
	/**
	 * 检查是否存在 client 连接
	 */
	hasClient(): boolean {
		return this.clients.size > 0;
	}
}
