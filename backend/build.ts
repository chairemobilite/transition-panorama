import { build } from 'esbuild';
import packageJson from './package.json' with { type: 'json' };

// Workspaces whose TypeScript sources must be compiled into the bundle
const bundledDependencies = new Set(['common', 'geocoder']);

await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    outfile: 'dist/index.js',
    external: Object.keys(packageJson.dependencies).filter(
        (name) => !bundledDependencies.has(name),
    ),
});
