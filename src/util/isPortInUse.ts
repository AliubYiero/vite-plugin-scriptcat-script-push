import net from 'net';

/**
 * 检查 ws 端口是否被占用
 */
export async function isPortInUse( port: number ): Promise<boolean> {
	return new Promise( ( resolve ) => {
		const server = net.createServer();
		server.once( 'error', ( err: any ) => {
			server.close();
			resolve( err.code === 'EADDRINUSE' );
		} );
		server.once( 'listening', () => {
			server.close();
			resolve( false );
		} );
		server.listen( port );
	} );
}
