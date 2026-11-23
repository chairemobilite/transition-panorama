import { createBaseConfig } from 'dev-config/eslint';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    createBaseConfig(new URL('.', import.meta.url).pathname),
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]);
