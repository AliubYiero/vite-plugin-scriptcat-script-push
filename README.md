# Vite Plugin ScriptCat Script Push

English / [中文](./README-zh.md)

## Features

Automatically push rebuilt JavaScript bundles to the ScriptCat extension via WebSocket during development. Enables instant script updates without manual reloading or reinstallation.

> The updated script still requires refreshing the page to be reloaded into the page.

## Installation

```bash
npm install @yiero/vite-plugin-scriptcat-script-push -D
# or
yarn add @yiero/vite-plugin-scriptcat-script-push -D
# or
pnpm add @yiero/vite-plugin-scriptcat-script-push -D
```

## Configuration

| Parameter | Type     | Description                                    | Default   |
| --------- | -------- | ---------------------------------------------- | --------- |
| `port`    | `number` | Port number for the WebSocket server           | `8642`    |
| `match`   | `RegExp` | Regular expression to match files to broadcast | `/\.js$/` |

## Usage

> **Note**: Only one ws server can be running at a time.

### Install the plugin

Add the plugin in `vite.config.js` / `vite.config.ts`:

**Basic Usage**

```ts
import { defineConfig } from 'vite'
import scriptPushPlugin from '@yiero/vite-plugin-scriptcat-script-push'

export default defineConfig({
  plugins: [
    // Other plugins...
    
    // Automatically push rebuilt scripts to ScriptCat
    scriptPushPlugin()
  ],
})
```

**Advanced Usage**

```ts
import { defineConfig } from 'vite'
import scriptPushPlugin from '@yiero/vite-plugin-scriptcat-script-push'

export default defineConfig({
  plugins: [
    // Push files with .user.js suffix on a custom port
    scriptPushPlugin({
      // Custom port
      port: 8642,
      // Custom script suffix to push
      match: /\.user\.js$/
    })
  ],
})
```

---

### Connect to the server

1. Open *Browser* - ScriptCat *Script List* interface
2. Click the *Tools* menu on the left
3. Find the *Development Debugging* section
4. Find *VSCode URL*, click the ***Connect*** button below
5. If using a custom port, modify the value of `ws://localhost:8642` to the corresponding port number: `ws://localhost:<port>`.

![image-20251214021257327](./iamges_README/image-20251214023949704.png)

---

### Develop the script

1. Build the script in `watch` mode: `vite build --watch`.

> If the script is successfully installed, it will show that the ws server has started below `watching for file changes...`:

```bash
watching for file changes...
[ScriptCat] WS server started on port 8642
```

2. Follow the steps in [Connect to the server](#connect-to-the-server) to connect to the ws server.

> If ScriptCat successfully connects to the ws server, it will show in the terminal:

```bash
[ScriptCat] client-1 connected
```

3. When you modify the script source file, triggering the vite rebuild process, the plugin will automatically push the completed bundled script to all connected clients.

> If the script broadcast is successful, it will show in the terminal:

```bash
[ScriptCat] broadcast to client-1: <local file path>
```

## How It Works

The plugin automatically performs the following operations:

1. Creates a WebSocket server on the specified port during Vite build
2. Checks if the port is available before starting the server
3. Maintains connections with all active clients
4. When Vite rebuilds and writes the bundle:
   - Filters files based on the matching pattern
   - Converts file paths to the correct URL
   - Broadcasts the updated script content to all connected clients
5. Sends a ping message every 30 seconds to keep the connection alive

## Contribution Guide

Please submit issues or PRs via [GitHub](https://github.com/AliubYiero/vite-plugin-scriptcat-script-push).

## License

GPL-3 © [AliubYiero](https://github.com/AliubYiero)