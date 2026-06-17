"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = require("@vitejs/plugin-react");
const vite_plugin_node_polyfills_1 = require("vite-plugin-node-polyfills");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)(), (0, vite_plugin_node_polyfills_1.nodePolyfills)({ include: ['buffer', 'crypto'] })],
    build: {
        outDir: '../public',
        emptyOutDir: true,
    },
    server: {
        port: Number(process.env.PORT) || 5173,
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
});
//# sourceMappingURL=vite.config.js.map