import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ProxyOptions } from 'vite';
import * as YAML from 'yaml';
import { z } from 'zod';
import { geocoderProviderNames } from '../src/geocoder-provider-names';
import type { GeocoderConfig } from './src/config/geocoder-configs';

const configFileName = 'config.yaml';

const configPath = fileURLToPath(new URL(configFileName, import.meta.url));

const ConfigSchema = z.object({
    geocoders: z.array(
        z.object({
            name: z.string().min(1),
            provider: z.enum(geocoderProviderNames),
            url: z.url(),
        }),
    ),
    userAgent: z.string().min(1),
});

type Config = z.infer<typeof ConfigSchema>;

const readConfig = (): Config => {
    if (!existsSync(configPath)) {
        throw new Error(
            `Missing ${configFileName} in the playground: copy and edit config.example.yaml to start`,
        );
    }
    return ConfigSchema.parse(YAML.parse(readFileSync(configPath, 'utf8')));
};

// The browser reaches each geocoder through the dev server, which avoids CORS
const createProxyPath = (index: number) => `/geocoders/${index}`;

const createProxy = (config: Config): Record<string, ProxyOptions> => {
    return Object.fromEntries(
        config.geocoders.map((geocoder, index) => {
            const proxyPath = createProxyPath(index);
            return [
                proxyPath,
                {
                    target: geocoder.url,
                    changeOrigin: true,
                    rewrite: (path) => path.slice(proxyPath.length),
                    headers: { 'User-Agent': config.userAgent },
                },
            ];
        }),
    );
};

const createGeocoderConfigs = (config: Config): GeocoderConfig[] => {
    return config.geocoders.map((geocoder, index) => {
        return {
            name: geocoder.name,
            providerName: geocoder.provider,
            url: createProxyPath(index),
        };
    });
};

const restartOnConfigChange = (): Plugin => ({
    name: 'restart-on-config-change',
    configureServer(server) {
        server.watcher.add(configPath);
        server.watcher.on('change', (file) => {
            if (file === configPath) {
                void server.restart();
            }
        });
    },
});

export default defineConfig(() => {
    const config = readConfig();
    return {
        plugins: [react(), tailwindcss(), restartOnConfigChange()],
        define: { __GEOCODER_CONFIGS__: createGeocoderConfigs(config) },
        server: { proxy: createProxy(config) },
    };
});
