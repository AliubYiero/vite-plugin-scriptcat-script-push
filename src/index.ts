import { Plugin } from 'vite';
import { WsServer } from './util/WsServer.ts';
import { join } from 'path';
import { pathToFileURL } from 'node:url';


interface ScriptPushPluginOptions {
	port: number;
	match: RegExp;
}

export default function scriptPushPlugin( options: Partial<ScriptPushPluginOptions> = {} ): Plugin {
	const serverPort = options.port || 8642;
	const regexpMatch = options.match || /\.js$/;
	const wsServer = new WsServer( serverPort );
	
	wsServer.isPortInUse().then( ( isPortInUse ) => {
		// 端口被占用, 不启动
		if ( isPortInUse ) {
			console.warn( `\x1b[33m[ScriptCat] Port ${ serverPort } unavailable\x1b[0m` );
			return;
		}
		
		// 启动 ws 服务器
		wsServer.create();
	} );
	
	return {
		name: 'vite-plugin-scriptcat-script-push',
		version: '1.1.0',
		
		writeBundle( option, bundle ) {
			// ws 服务器不存在, 不处理
			if ( !wsServer.hasServer() ) {
				return;
			}
			
			for ( let fileName in bundle ) {
				const chunk = bundle[ fileName ];
				// 只处理 chunk
				if ( chunk.type !== 'chunk' ) continue;
				// 只处理匹配文件名
				if ( !regexpMatch.test( fileName ) ) continue;
				
				const dir = option.dir || join( __dirname, 'dist' );
				const filepath = join( dir, fileName );
				const fileUri = pathToFileURL( filepath ).href;
				
				// ws 服务器存在, 没有客户端连接, 缓存脚本内容
				if ( !wsServer.hasClient() ) {
					wsServer.cacheScript( chunk.code, fileUri );
					continue;
				}
				
				// 广播脚本内容
				wsServer.broadcastScript( chunk.code, fileUri );
			}
		},
	};
};
