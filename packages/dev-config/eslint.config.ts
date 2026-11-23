import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { createBaseConfig } from 'dev-config/eslint';

export default defineConfig([
    createBaseConfig(new URL('.', import.meta.url).pathname),
    { languageOptions: { globals: globals.node } },
]);
