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
			console.warn( `[ScriptCat] Port ${ serverPort } unavailable` );
			return;
		}
		
		// 启动 ws 服务器
		wsServer.create();
	} );
	
	return {
		name: 'vite-plugin-scriptcat-script-push',
		version: '1.0.0',
		
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
				wsServer.broadcast( {
					action: 'onchange',
					data: {
						script: chunk.code,
						uri: pathToFileURL( filepath ).href,
					},
				} );
			}
		},
	};
};
