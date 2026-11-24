import { createBaseConfig } from 'dev-config/eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    globalIgnores(['coverage', 'dist']),
    createBaseConfig(new URL('.', import.meta.url).pathname),
    { languageOptions: { globals: globals.node } },
]);
