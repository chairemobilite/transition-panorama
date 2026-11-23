import { createBaseConfig } from 'dev-config/eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
    globalIgnores(['coverage']),
    createBaseConfig(new URL('.', import.meta.url).pathname),
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [reactHooks.configs.flat.recommended],
    },
]);
